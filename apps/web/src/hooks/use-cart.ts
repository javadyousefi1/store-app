"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import {
  addGuestCartItem,
  clearGuestCart,
  getGuestCartItems,
  setGuestCartItems,
  type GuestCartItem,
} from "@/lib/guest-cart";
import {
  AUTH_SESSION_QUERY_KEY,
  useAuthSession,
} from "@/hooks/use-auth";

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

const QUERY_KEY = ["cart"] as const;

function guestItemsToCart(items: GuestCartItem[]): Cart | null {
  if (!items.length) return null;

  return {
    id: "guest",
    userId: "guest",
    createdAt: "",
    updatedAt: "",
    items: items.map((item, index) => ({
      id: `guest-${index}`,
      variantId: item.variantId,
      quantity: item.quantity,
      variant: {
        id: item.variantId,
        sku: "",
        price: "0",
        stock: 0,
        reserved: 0,
        attributes: {},
        imageIds: [],
        imageUrls: [],
      },
    })),
  };
}

function cartQueryKey(isAuthenticated: boolean) {
  return [...QUERY_KEY, isAuthenticated ? "auth" : "guest"] as const;
}

export function useCart() {
  const { data: session, isFetched } = useAuthSession();

  return useQuery<Cart | null>({
    queryKey: cartQueryKey(Boolean(session)),
    queryFn: async () => {
      if (!session) {
        return guestItemsToCart(getGuestCartItems());
      }

      try {
        const response = await apiClient.get("/cart");
        return response.data.data ?? null;
      } catch {
        return null;
      }
    },
    enabled: isFetched,
    staleTime: 30_000,
    retry: false,
  });
}

export function useCartCount() {
  const { data } = useCart();
  return data?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
}

export function useAddToCart() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      variantId,
      qty,
    }: {
      variantId: string;
      qty: number;
    }) => {
      const session = qc.getQueryData(AUTH_SESSION_QUERY_KEY);

      if (!session) {
        const items = addGuestCartItem(variantId, qty);
        return guestItemsToCart(items)!;
      }

      const current = qc.getQueryData<Cart | null>(cartQueryKey(true));
      const currentItems = current?.items ?? [];

      const existing = currentItems.find((item) => item.variantId === variantId);
      const newItems = existing
        ? currentItems.map((item) =>
            item.variantId === variantId
              ? { variantId: item.variantId, quantity: item.quantity + qty }
              : { variantId: item.variantId, quantity: item.quantity },
          )
        : [
            ...currentItems.map((item) => ({
              variantId: item.variantId,
              quantity: item.quantity,
            })),
            { variantId, quantity: qty },
          ];

      const response = await apiClient.put("/cart", { items: newItems });
      return response.data.data;
    },
    onSuccess: (data) => {
      const session = qc.getQueryData(AUTH_SESSION_QUERY_KEY);
      qc.setQueryData(cartQueryKey(Boolean(session)), data);
    },
  });
}

export function useRemoveFromCart() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (variantId: string) => {
      const session = qc.getQueryData(AUTH_SESSION_QUERY_KEY);

      if (!session) {
        const items = getGuestCartItems().filter(
          (item) => item.variantId !== variantId,
        );
        setGuestCartItems(items);
        return guestItemsToCart(items);
      }

      const current = qc.getQueryData<Cart | null>(cartQueryKey(true));
      const newItems = (current?.items ?? [])
        .filter((item) => item.variantId !== variantId)
        .map((item) => ({
          variantId: item.variantId,
          quantity: item.quantity,
        }));
      const response = await apiClient.put("/cart", { items: newItems });
      return response.data.data;
    },
    onSuccess: (data) => {
      const session = qc.getQueryData(AUTH_SESSION_QUERY_KEY);
      qc.setQueryData(cartQueryKey(Boolean(session)), data);
    },
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
      const session = qc.getQueryData(AUTH_SESSION_QUERY_KEY);

      if (!session) {
        const items = getGuestCartItems()
          .map((item) => ({
            variantId: item.variantId,
            quantity: item.variantId === variantId ? quantity : item.quantity,
          }))
          .filter((item) => item.quantity > 0);
        setGuestCartItems(items);
        return guestItemsToCart(items);
      }

      const current = qc.getQueryData<Cart | null>(cartQueryKey(true));
      const newItems = (current?.items ?? [])
        .map((item) => ({
          variantId: item.variantId,
          quantity: item.variantId === variantId ? quantity : item.quantity,
        }))
        .filter((item) => item.quantity > 0);

      const response = await apiClient.put("/cart", { items: newItems });
      return response.data.data;
    },
    onSuccess: (data) => {
      const session = qc.getQueryData(AUTH_SESSION_QUERY_KEY);
      qc.setQueryData(cartQueryKey(Boolean(session)), data);
    },
  });
}

export function useClearCart() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const session = qc.getQueryData(AUTH_SESSION_QUERY_KEY);

      if (!session) {
        clearGuestCart();
        return null;
      }

      const response = await apiClient.put("/cart", { items: [] });
      return response.data.data;
    },
    onSuccess: (data) => {
      const session = qc.getQueryData(AUTH_SESSION_QUERY_KEY);
      qc.setQueryData(cartQueryKey(Boolean(session)), data);
    },
  });
}

export function useMergeGuestCart() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const guestItems = getGuestCartItems();
      if (!guestItems.length) return null;

      const response = await apiClient.put("/cart", { items: guestItems });
      clearGuestCart();
      return response.data.data;
    },
    onSuccess: (data) => {
      qc.setQueryData(cartQueryKey(true), data);
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
