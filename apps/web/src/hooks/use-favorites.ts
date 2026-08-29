"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import {
  addGuestFavorite,
  clearGuestFavorites,
  getGuestFavorites,
  removeGuestFavorite,
  type GuestFavorite,
  type GuestFavoriteSnapshot,
} from "@/lib/guest-favorites";
import { AUTH_SESSION_QUERY_KEY, useAuthSession } from "@/hooks/use-auth";
import type { ApiResponse, AuthSession, FavoriteItem } from "@/types";

export const FAVORITES_QUERY_KEY = ["favorites"] as const;

/**
 * Kept for API compatibility with callers that used to bail out when
 * the user wasn't logged in. Guest favorites work without any auth
 * now, so the hook layer never throws this — but the class stays so
 * existing consumers can `instanceof` check without breaking.
 */
export class UnauthenticatedFavoriteError extends Error {
  constructor() {
    super("UNAUTHENTICATED");
    this.name = "UnauthenticatedFavoriteError";
  }
}

function guestFavoritesToItems(list: GuestFavorite[]): FavoriteItem[] {
  return list.map((item, index) => ({
    favoriteId: `guest-${index}-${item.productId}`,
    productId: item.productId,
    product: {
      id: item.productId,
      slug: item.snapshot?.slug ?? "",
      name: item.snapshot?.name ?? "",
      coverUrl: item.snapshot?.coverUrl ?? null,
    },
    createdAt: item.addedAt,
  }));
}

function favoritesQueryKey(isAuthenticated: boolean) {
  return [...FAVORITES_QUERY_KEY, isAuthenticated ? "auth" : "guest"] as const;
}

export function useFavorites() {
  const { data: session, isFetched } = useAuthSession();
  const isAuth = Boolean(session);

  return useQuery<FavoriteItem[]>({
    queryKey: favoritesQueryKey(isAuth),
    queryFn: async () => {
      if (!isAuth) {
        return guestFavoritesToItems(getGuestFavorites());
      }
      const res = await apiClient.get<ApiResponse<FavoriteItem[]>>(
        "/favorites",
      );
      return res.data.data;
    },
    enabled: isFetched,
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
  /** Product snapshot persisted alongside guest favorites so /favorites
   * renders correctly for logged-out visitors. Ignored for auth users. */
  snapshot?: GuestFavoriteSnapshot;
}

export function useToggleFavorite() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, isFavorite, snapshot }: ToggleVars) => {
      const session = qc.getQueryData<AuthSession | null>(AUTH_SESSION_QUERY_KEY);

      if (!session) {
        const items = isFavorite
          ? removeGuestFavorite(productId)
          : addGuestFavorite(productId, snapshot);
        return guestFavoritesToItems(items);
      }

      if (isFavorite) {
        await apiClient.delete(`/favorites/${productId}`);
      } else {
        await apiClient.post("/favorites", { productId });
      }
      return null;
    },
    onMutate: async ({ productId, isFavorite, snapshot }) => {
      const session = qc.getQueryData<AuthSession | null>(AUTH_SESSION_QUERY_KEY);
      const key = favoritesQueryKey(Boolean(session));

      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<FavoriteItem[]>(key);

      qc.setQueryData<FavoriteItem[]>(key, (current) => {
        const list = current ?? [];
        if (isFavorite) {
          return list.filter((item) => item.productId !== productId);
        }
        if (list.some((item) => item.productId === productId)) return list;
        const placeholder: FavoriteItem = {
          favoriteId: `optimistic-${productId}`,
          productId,
          product: {
            id: productId,
            slug: snapshot?.slug ?? "",
            name: snapshot?.name ?? "",
            coverUrl: snapshot?.coverUrl ?? null,
          },
          createdAt: new Date().toISOString(),
        };
        return [placeholder, ...list];
      });

      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      const session = qc.getQueryData<AuthSession | null>(AUTH_SESSION_QUERY_KEY);
      if (ctx?.previous !== undefined) {
        qc.setQueryData(favoritesQueryKey(Boolean(session)), ctx.previous);
      }
    },
    onSettled: () => {
      const session = qc.getQueryData<AuthSession | null>(AUTH_SESSION_QUERY_KEY);
      qc.invalidateQueries({ queryKey: favoritesQueryKey(Boolean(session)) });
    },
  });
}

/**
 * Called right after OTP verify. POST /favorites is idempotent on the
 * backend, so we replay every guest favorite in parallel — server ones
 * survive, guest ones union in. Then localStorage is cleared regardless
 * so we don't retry stale entries forever.
 */
export function useMergeGuestFavorites() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const guestFavs = getGuestFavorites();
      if (!guestFavs.length) return;

      await Promise.allSettled(
        guestFavs.map((f) =>
          apiClient.post("/favorites", { productId: f.productId }),
        ),
      );

      clearGuestFavorites();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: FAVORITES_QUERY_KEY });
    },
  });
}
