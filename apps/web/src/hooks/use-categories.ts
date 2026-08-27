"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { ApiResponse, Category, CreateCategoryRequest, UpdateCategoryRequest } from "@/types";

const QUERY_KEY = ["categories"];

export function useCategories(enabled = true) {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      apiClient
        .get<ApiResponse<Category[]>>("/categories")
        .then((r) => r.data.data),
    enabled,
  });
}

export function useCategoryBySlug(slug: string | undefined, enabled = true) {
  return useQuery({
    queryKey: ["categories", "by-slug", slug],
    queryFn: () =>
      apiClient
        .get<ApiResponse<Category>>(`/categories/by-slug/${slug}`)
        .then((r) => r.data.data),
    enabled: !!slug && enabled,
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryRequest) =>
      apiClient
        .post<ApiResponse<Category>>("/categories", data)
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryRequest }) =>
      apiClient
        .patch<ApiResponse<Category>>(`/categories/${id}`, data)
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/categories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

// ── Cover upload ──────────────────────────────────────────────────────────────

export const COVER_ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const COVER_MAX_BYTES = 5 * 1024 * 1024;

type CoverMime = (typeof COVER_ALLOWED_MIME)[number];

interface PresignResponse {
  mediaKey: string;
  uploadUrl: string;
  expiresIn: number;
  requiredHeaders: Record<string, string>;
}

export function useUploadCategoryCover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      if (!COVER_ALLOWED_MIME.includes(file.type as CoverMime)) {
        throw new Error("فرمت تصویر باید JPEG، PNG یا WebP باشد");
      }
      if (file.size > COVER_MAX_BYTES) {
        throw new Error("حجم تصویر باید کمتر از ۵ مگابایت باشد");
      }

      const presign = await apiClient
        .post<ApiResponse<PresignResponse>>(`/categories/${id}/cover`, {
          action: "presign",
          mimeType: file.type,
        })
        .then((r) => r.data.data);

      // Direct upload to MinIO — must not go through the API proxy
      // and must not carry an Authorization header.
      const putRes = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: presign.requiredHeaders,
        body: file,
      });
      if (!putRes.ok) {
        throw new Error("آپلود فایل ناموفق بود");
      }

      return apiClient
        .post<ApiResponse<Category>>(`/categories/${id}/cover`, {
          action: "confirm",
          mediaKey: presign.mediaKey,
          originalName: file.name,
        })
        .then((r) => r.data.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useRemoveCategoryCover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient
        .post<ApiResponse<{ removed: boolean }>>(`/categories/${id}/cover`, {
          action: "remove",
        })
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
