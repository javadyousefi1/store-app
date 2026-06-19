"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type {
  ApiResponse,
  CreateProductRequest,
  PaginatedResponse,
  Product,
  ProductDetail,
  UpdateProductRequest,
} from "@/types";

export function useProducts(page = 1, categoryId?: string) {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (categoryId) params.set("categoryId", categoryId);

  return useQuery({
    queryKey: ["products", page, categoryId],
    queryFn: () =>
      apiClient
        .get<ApiResponse<PaginatedResponse<Product>>>(`/products?${params}`)
        .then((r) => r.data.data),
  });
}

export function useProduct(id: string) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () =>
      apiClient
        .get<ApiResponse<ProductDetail>>(`/products/${id}`)
        .then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProductRequest) =>
      apiClient.post<ApiResponse<Product>>("/products", data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductRequest }) =>
      apiClient
        .patch<ApiResponse<Product>>(`/products/${id}`, data)
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/products/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUploadProductCover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const form = new FormData();
      form.append("file", file);
      return apiClient.post(`/products/${id}/cover`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProductCover() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/products/${id}/cover`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useNotifyProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.post<{ data: { notified: boolean } }>(`/products/${id}/notify`).then((r) => r.data.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["product", id] });
    },
  });
}
