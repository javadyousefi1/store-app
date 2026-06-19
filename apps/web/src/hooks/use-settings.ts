"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";

export interface BankCard {
  bankName: string;
  accountHolder: string;
  cardNumber: string;
}

export interface Settings {
  id: number;
  tokenBaleBot: string | null;
  bankCard: BankCard | null;
  updatedAt: string;
}

export interface UpdateSettingsBody {
  tokenBaleBot?: string | null;
  bankCard?: BankCard | null;
}

const QK = ["settings"];

export function useSettings() {
  return useQuery<Settings>({
    queryKey: QK,
    queryFn: () => apiClient.get("/settings").then((r) => r.data.data),
    staleTime: 60_000,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateSettingsBody) =>
      apiClient.put("/settings", body).then((r) => r.data.data),
    onSuccess: (data) => qc.setQueryData(QK, data),
  });
}
