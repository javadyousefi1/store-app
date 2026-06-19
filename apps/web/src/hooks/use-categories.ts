"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { ApiResponse, Category, CreateCategoryRequest, UpdateCategoryRequest } from "@/types";

const QUERY_KEY = ["categories"];

export function useCategories() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      apiClient
        .get<ApiResponse<Category[]>>("/categories")
        .then((r) => r.data.data),
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
