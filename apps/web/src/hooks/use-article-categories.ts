"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type {
  ApiResponse,
  ArticleCategory,
  CreateArticleCategoryRequest,
  UpdateArticleCategoryRequest,
} from "@/types";

const QUERY_KEY = ["admin", "article-categories"] as const;

export function useAdminArticleCategories() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      apiClient
        .get<ApiResponse<ArticleCategory[]>>("/admin/article-categories")
        .then((r) => r.data.data),
    staleTime: 30_000,
  });
}

export function useCreateArticleCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateArticleCategoryRequest) =>
      apiClient
        .post<ApiResponse<ArticleCategory>>("/admin/article-categories", data)
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateArticleCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateArticleCategoryRequest }) =>
      apiClient
        .patch<ApiResponse<ArticleCategory>>(`/admin/article-categories/${id}`, data)
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteArticleCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/admin/article-categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
