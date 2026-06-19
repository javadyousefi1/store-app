"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { ApiResponse, Attribute } from "@/types";

const QUERY_KEY = ["attributes"];

export function useAttributeOptions() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      apiClient.get<ApiResponse<Attribute[]>>("/attributes").then((r) => r.data.data),
  });
}

export function useCreateAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (name: string) =>
      apiClient.post<ApiResponse<Attribute>>("/attributes", { name }).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteAttribute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/attributes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useAddAttributeValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ attributeId, value, label }: { attributeId: string; value: string; label?: string }) =>
      apiClient.post(`/attributes/${attributeId}/values`, { value, ...(label ? { label } : {}) }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteAttributeValue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ attributeId, valueId }: { attributeId: string; valueId: string }) =>
      apiClient.delete(`/attributes/${attributeId}/values/${valueId}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
