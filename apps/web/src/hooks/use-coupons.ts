"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type {
  ApiResponse,
  Coupon,
  CouponQuoteResponse,
  CreateCouponRequest,
  PaginatedResponse,
  UpdateCouponRequest,
} from "@/types";

const QUERY_KEY = ["admin", "coupons"] as const;

interface ListParams {
  page?: number;
  limit?: number;
  isActive?: boolean;
}

export function useCoupons(params: ListParams = {}) {
  const search = new URLSearchParams();
  search.set("page", String(params.page ?? 1));
  search.set("limit", String(params.limit ?? 20));
  if (params.isActive !== undefined) search.set("isActive", String(params.isActive));

  return useQuery({
    queryKey: [...QUERY_KEY, "list", params],
    queryFn: () =>
      apiClient
        .get<ApiResponse<PaginatedResponse<Coupon>>>(`/admin/coupons?${search}`)
        .then((r) => r.data.data),
  });
}

export function useCoupon(id: string | null) {
  return useQuery({
    queryKey: [...QUERY_KEY, "detail", id],
    queryFn: () =>
      apiClient
        .get<ApiResponse<Coupon>>(`/admin/coupons/${id}`)
        .then((r) => r.data.data),
    enabled: !!id,
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCouponRequest) =>
      apiClient
        .post<ApiResponse<Coupon>>("/admin/coupons", data)
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCouponRequest }) =>
      apiClient
        .patch<ApiResponse<Coupon>>(`/admin/coupons/${id}`, data)
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useQuoteCoupon() {
  return useMutation({
    mutationFn: (code: string) =>
      apiClient
        .post<ApiResponse<CouponQuoteResponse>>("/coupons/quote", { code })
        .then((r) => r.data.data),
  });
}
