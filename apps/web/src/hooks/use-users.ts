"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { ApiResponse, PaginatedResponse, User } from "@/types";

export function useUsers(page = 1, limit = 20) {
  return useQuery({
    queryKey: ["users", page],
    queryFn: () =>
      apiClient
        .get<ApiResponse<PaginatedResponse<User>>>(`/user?page=${page}&limit=${limit}`)
        .then((r) => r.data.data),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/user/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["users"] }),
  });
}
