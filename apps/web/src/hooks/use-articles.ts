"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type {
  ApiResponse,
  Article,
  ArticleMediaItem,
  CreateArticleRequest,
  PaginatedResponse,
  UpdateArticleRequest,
} from "@/types";

const QUERY_KEY = ["admin", "articles"] as const;

interface ListParams {
  page?: number;
  limit?: number;
  status?: "published" | "draft";
  categoryId?: string;
  search?: string;
}

export function useAdminArticles(params: ListParams = {}) {
  const search = new URLSearchParams();
  search.set("page",  String(params.page  ?? 1));
  search.set("limit", String(params.limit ?? 20));
  if (params.status)     search.set("status",     params.status);
  if (params.categoryId) search.set("categoryId", params.categoryId);
  const trimmed = params.search?.trim();
  if (trimmed) search.set("search", trimmed);

  return useQuery({
    queryKey: [...QUERY_KEY, "list", params],
    queryFn: () =>
      apiClient
        .get<ApiResponse<PaginatedResponse<Article>>>(`/admin/articles?${search}`)
        .then((r) => r.data.data),
    staleTime: 15_000,
  });
}

export function useAdminArticle(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, "detail", id],
    queryFn: () =>
      apiClient
        .get<ApiResponse<Article>>(`/admin/articles/${id}`)
        .then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateArticleRequest) =>
      apiClient
        .post<ApiResponse<Article>>("/admin/articles", data)
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateArticleRequest }) =>
      apiClient
        .patch<ApiResponse<Article>>(`/admin/articles/${id}`, data)
        .then((r) => r.data.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, "detail", id] });
    },
  });
}

export function useDeleteArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/articles/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

// ── Media ──────────────────────────────────────────────────────────────

export function useUploadArticleMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ articleId, file, alt }: { articleId: string; file: File; alt?: string }) => {
      const form = new FormData();
      form.append("file", file);
      if (alt) form.append("alt", alt);
      return apiClient
        .post<ApiResponse<ArticleMediaItem>>(`/admin/articles/${articleId}/media`, form)
        .then((r) => r.data.data);
    },
    onSuccess: (_, { articleId }) => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, "detail", articleId] });
    },
  });
}

export function useDeleteArticleMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ articleId, key }: { articleId: string; key: string }) =>
      apiClient.delete(`/admin/articles/${articleId}/media`, { data: { key } }),
    onSuccess: (_, { articleId }) => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, "detail", articleId] });
    },
  });
}
