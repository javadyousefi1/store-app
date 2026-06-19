"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { ApiResponse, CreateOrderRequest, Order, OrderDetail, PaginatedResponse } from "@/types";

const QUERY_KEY = ["user-orders"];

export function useUserOrders(page: number) {
  return useQuery({
    queryKey: [...QUERY_KEY, page],
    queryFn: () =>
      apiClient
        .get<ApiResponse<PaginatedResponse<Order>>>(`/orders?page=${page}&limit=10`)
        .then((r) => r.data.data),
    retry: false,
    staleTime: 30_000,
  });
}

export function useUserOrder(id: string) {
  return useQuery({
    queryKey: [...QUERY_KEY, id],
    queryFn: () =>
      apiClient.get<ApiResponse<OrderDetail>>(`/orders/${id}`).then((r) => r.data.data),
    retry: false,
    staleTime: 0,
  });
}

export function usePlaceOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateOrderRequest) =>
      apiClient.post<ApiResponse<Order>>("/orders", body).then((r) => r.data.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cart"] });
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useUploadReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, file }: { orderId: string; file: File }) => {
      const form = new FormData();
      form.append("file", file);
      return apiClient
        .post(`/orders/${orderId}/receipt`, form)
        .then((r) => r.data.data);
    },
    onSuccess: (_, { orderId }) => {
      qc.invalidateQueries({ queryKey: [...QUERY_KEY, orderId] });
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useCancelOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/orders/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
