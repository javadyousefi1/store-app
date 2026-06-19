"use client";
import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type { ApiResponse, DashboardData } from "@/types";

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () =>
      apiClient
        .get<ApiResponse<DashboardData>>("/admin/dashboard")
        .then((r) => r.data.data),
    staleTime: 60_000,
  });
}
