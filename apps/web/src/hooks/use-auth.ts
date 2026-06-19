"use client";

import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import type { AuthResponse, GetOtpRequest, VerifyOtpRequest } from "@/types";

const authAxios = axios.create({ baseURL: "/api/auth" });

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
