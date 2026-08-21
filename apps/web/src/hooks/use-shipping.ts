"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type {
  ApiResponse,
  ShippingCity,
  ShippingQuote,
  ShippingState,
} from "@/types";

export function useShippingStates() {
  return useQuery({
    queryKey: ["shipping", "states"],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<ShippingState[]>>(
        "/shipping/states",
      );
      return res.data.data;
    },
    staleTime: 24 * 60 * 60 * 1000, // 1 day — provinces don't move
  });
}

export function useShippingCities(stateCode: number | null) {
  return useQuery({
    queryKey: ["shipping", "cities", stateCode],
    queryFn: async () => {
      const res = await apiClient.get<ApiResponse<ShippingCity[]>>(
        `/shipping/cities?stateCode=${stateCode}`,
      );
      return res.data.data;
    },
    enabled: stateCode != null,
    staleTime: 24 * 60 * 60 * 1000,
  });
}

/**
 * Quote uses the server-side cart, so the client only picks the city.
 * Runs as a mutation because the shopper triggers it explicitly (after
 * picking a city) and we want fresh data every time — not cached.
 */
export function useShippingQuote() {
  return useMutation({
    mutationFn: async (cityCode: number) => {
      const res = await apiClient.post<ApiResponse<ShippingQuote>>(
        "/shipping/quote",
        { cityCode },
      );
      return res.data.data;
    },
  });
}
