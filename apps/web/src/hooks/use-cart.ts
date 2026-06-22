"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";

export interface CartVariant {
  id: string;
  sku: string;
  price: string;
  stock: number;
  reserved: number;
  attributes: Record<string, string>;
  imageIds: string[];
  imageUrls: string[];
  product?: {
    id: string;
    name: string;
  };
}

export interface CartItem {
  id: string;
  variantId: string;
  quantity: number;
  variant: CartVariant;
}

export interface Cart {
  id: string;
  userId: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

const QUERY_KEY = ["cart"];

export function useCart() {
  return useQuery<Cart | null>({
    queryKey: QUERY_KEY,
    queryFn: async () => {
      try {
        const r = await apiClient.get("/cart");
        return r.data.data ?? null;
      } catch {
        return null;
      }
    },
    staleTime: 30_000,
    retry: false,
  });
}

export function useCartCount() {
  const { data } = useCart();
  return data?.items.reduce((s, i) => s + i.quantity, 0) ?? 0;
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ variantId, qty }: { variantId: string; qty: number }) => {
      const current = qc.getQueryData<Cart | null>(QUERY_KEY);
      const currentItems = current?.items ?? [];

      const existing = currentItems.find((i) => i.variantId === variantId);
      const newItems = existing
        ? currentItems.map((i) =>
            i.variantId === variantId ? { variantId: i.variantId, quantity: i.quantity + qty } : { variantId: i.variantId, quantity: i.quantity }
          )
        : [...currentItems.map((i) => ({ variantId: i.variantId, quantity: i.quantity })), { variantId, quantity: qty }];

      const r = await apiClient.put("/cart", { items: newItems });
      return r.data.data;
    },
    onSuccess: (data) => qc.setQueryData(QUERY_KEY, data),
  });
}

export function useRemoveFromCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (variantId: string) => {
      const current = qc.getQueryData<Cart | null>(QUERY_KEY);
      const newItems = (current?.items ?? [])
        .filter((i) => i.variantId !== variantId)
        .map((i) => ({ variantId: i.variantId, quantity: i.quantity }));
      const r = await apiClient.put("/cart", { items: newItems });
      return r.data.data;
    },
    onSuccess: (data) => qc.setQueryData(QUERY_KEY, data),
  });
}

export function useUpdateCartQuantity() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      variantId,
      quantity,
    }: {
      variantId: string;
      quantity: number;
    }) => {
      const current = qc.getQueryData<Cart | null>(QUERY_KEY);
      const newItems = (current?.items ?? [])
        .map((item) => ({
          variantId: item.variantId,
          quantity:
            item.variantId === variantId ? quantity : item.quantity,
        }))
        .filter((item) => item.quantity > 0);

      const response = await apiClient.put("/cart", { items: newItems });
      return response.data.data;
    },
    onSuccess: (data) => qc.setQueryData(QUERY_KEY, data),
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.put("/cart", { items: [] }).then((r) => r.data.data),
    onSuccess: (data) => qc.setQueryData(QUERY_KEY, data),
  });
}
