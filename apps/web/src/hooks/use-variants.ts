"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { CreateVariantRequest, UpdateVariantRequest } from "@/types";

export function useCreateVariant(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateVariantRequest) =>
      apiClient.post(`/products/${productId}/variants`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products", productId] }),
  });
}

export function useUpdateVariant(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, data }: { variantId: string; data: UpdateVariantRequest }) =>
      apiClient.patch(`/products/${productId}/variants/${variantId}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products", productId] }),
  });
}

export function useDeleteVariant(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (variantId: string) =>
      apiClient.delete(`/products/${productId}/variants/${variantId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products", productId] }),
  });
}

export function useUploadVariantImage(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, file }: { variantId: string; file: File }) => {
      const form = new FormData();
      form.append("file", file);
      return apiClient.post(
        `/products/${productId}/variants/${variantId}/images`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } }
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products", productId] }),
  });
}

export function useDeleteVariantImage(productId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ variantId, imageId }: { variantId: string; imageId: string }) =>
      apiClient.delete(`/products/${productId}/variants/${variantId}/images/${imageId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products", productId] }),
  });
}

export function useNotifyMe(variantId: string | null) {
  return useQuery<{ registered: boolean }>({
    queryKey: ["notify-me", variantId],
    queryFn: () =>
      apiClient.get(`/variants/${variantId}/notify-me`).then((r) => r.data.data ?? r.data),
    enabled: !!variantId,
    retry: false,
  });
}

export function useRegisterNotifyMe(variantId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.post(`/variants/${variantId}/notify-me`),
    onSuccess: () => qc.setQueryData(["notify-me", variantId], { registered: true }),
  });
}
