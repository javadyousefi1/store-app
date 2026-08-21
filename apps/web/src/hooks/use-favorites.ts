"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import { triggerAuthModal } from "@/lib/auth-modal-trigger";
import { AUTH_SESSION_QUERY_KEY, useAuthSession } from "@/hooks/use-auth";
import type { ApiResponse, AuthSession, FavoriteItem } from "@/types";

export const FAVORITES_QUERY_KEY = ["favorites"] as const;

export class UnauthenticatedFavoriteError extends Error {
  constructor() {
    super("UNAUTHENTICATED");
    this.name = "UnauthenticatedFavoriteError";
  }
}

export function useFavorites() {
  const { data: session, isFetched } = useAuthSession();
  return useQuery<FavoriteItem[]>({
    queryKey: FAVORITES_QUERY_KEY,
    queryFn: () =>
      apiClient
        .get<ApiResponse<FavoriteItem[]>>("/favorites")
        .then((r) => r.data.data),
    enabled: isFetched && Boolean(session),
    staleTime: 30_000,
  });
}

export function useFavoriteIds(): Set<string> {
  const { data } = useFavorites();
  return useMemo(
    () => new Set(data?.map((item) => item.productId) ?? []),
    [data],
  );
}

export function useIsFavorite(productId: string): boolean {
  return useFavoriteIds().has(productId);
}

interface ToggleVars {
  productId: string;
  isFavorite: boolean;
}

export function useToggleFavorite() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, isFavorite }: ToggleVars) => {
      const session = qc.getQueryData<AuthSession | null>(AUTH_SESSION_QUERY_KEY);
      if (!session) {
        triggerAuthModal();
        throw new UnauthenticatedFavoriteError();
      }
      if (isFavorite) {
        await apiClient.delete(`/favorites/${productId}`);
      } else {
        await apiClient.post("/favorites", { productId });
      }
    },
    onMutate: async ({ productId, isFavorite }) => {
      const session = qc.getQueryData<AuthSession | null>(AUTH_SESSION_QUERY_KEY);
      if (!session) return { previous: undefined };

      await qc.cancelQueries({ queryKey: FAVORITES_QUERY_KEY });
      const previous = qc.getQueryData<FavoriteItem[]>(FAVORITES_QUERY_KEY);

      qc.setQueryData<FavoriteItem[]>(FAVORITES_QUERY_KEY, (current) => {
        const list = current ?? [];
        if (isFavorite) {
          return list.filter((item) => item.productId !== productId);
        }
        if (list.some((item) => item.productId === productId)) return list;
        const placeholder: FavoriteItem = {
          favoriteId: `optimistic-${productId}`,
          productId,
          product: { id: productId, slug: "", name: "", coverUrl: null },
          createdAt: new Date().toISOString(),
        };
        return [placeholder, ...list];
      });

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous !== undefined) {
        qc.setQueryData(FAVORITES_QUERY_KEY, ctx.previous);
      }
    },
    onSettled: (_data, _err, _vars, ctx) => {
      // Skip refetch when we never made the call (unauthenticated).
      if (ctx?.previous === undefined) return;
      qc.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
    },
  });
}
