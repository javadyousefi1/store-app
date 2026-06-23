"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import axios from "axios";
import type {
  AuthResponse,
  AuthSession,
  GetOtpRequest,
  VerifyOtpRequest,
} from "@/types";

const authAxios = axios.create({ baseURL: "/api/auth" });
export const AUTH_SESSION_QUERY_KEY = ["auth-session"] as const;

export function useAuthSession() {
  return useQuery({
    queryKey: AUTH_SESSION_QUERY_KEY,
    queryFn: async () => {
      try {
        const response = await authAxios.get<{ data: AuthSession | null }>(
          "/session",
        );
        return response.data.data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          return null;
        }
        throw error;
      }
    },
    retry: false,
    staleTime: 60_000,
  });
}

export function useGetOtp() {
  return useMutation({
    mutationFn: (data: GetOtpRequest) =>
      authAxios.post<{ statusCode: number; data: { message: string; otp?: string } }>("/get-otp", data).then((r) => r.data),
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (data: VerifyOtpRequest) =>
      authAxios.post<AuthResponse>("/verify-otp", data).then((r) => r.data),
  });
}

export function useResendOtp() {
  return useMutation({
    mutationFn: (data: Pick<GetOtpRequest, "phone">) =>
      authAxios.post<{ message: string }>("/resend-otp", data).then((r) => r.data),
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: () => authAxios.post("/logout").then((r) => r.data),
  });
}
