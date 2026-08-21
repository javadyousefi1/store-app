"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { ApiResponse, Order, OrderDetail, OrderStatus, PaginatedResponse } from "@/types";

const QUERY_KEY = ["admin-orders"];

export function useAdminOrders(page: number, status?: OrderStatus, search?: string) {
  const trimmed = search?.trim() ?? "";
  return useQuery({
    queryKey: [...QUERY_KEY, page, status, trimmed],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (status) params.set("status", status);
      if (trimmed) params.set("search", trimmed);
      return apiClient
        .get<ApiResponse<PaginatedResponse<Order>>>(`/admin/orders?${params}`)
        .then((r) => r.data.data);
    },
    staleTime: 30_000,
  });
}

export function useAdminOrder(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () =>
      apiClient
        .get<ApiResponse<OrderDetail>>(`/admin/orders/${id}`)
        .then((r) => r.data.data),
    staleTime: 0,
  });
}

export function useConfirmOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.patch<ApiResponse<Order>>(`/admin/payments/${id}/confirm`).then((r) => r.data.data),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, id] });
    },
  });
}

export function useRejectOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, adminNote }: { id: string; adminNote?: string }) =>
      apiClient
        .patch<ApiResponse<Order>>(`/admin/payments/${id}/reject`, adminNote ? { adminNote } : {})
        .then((r) => r.data.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, id] });
    },
  });
}
