"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/axios";
import type {
  ApiResponse,
  CreateSliderRequest,
  Slider,
  UpdateSliderRequest,
} from "@/types";

const QUERY_KEY = ["sliders", "admin"];

export const SLIDER_IMAGE_ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const SLIDER_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

type SliderImageMime = (typeof SLIDER_IMAGE_ALLOWED_MIME)[number];
export type SliderVariant = "desktop" | "mobile";

interface PresignResponse {
  mediaKey: string;
  uploadUrl: string;
  expiresIn: number;
  requiredHeaders: Record<string, string>;
}

export function useSliders() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      apiClient
        .get<ApiResponse<Slider[]>>("/sliders/admin")
        .then((r) => r.data.data),
  });
}

export function useCreateSlider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSliderRequest) =>
      apiClient
        .post<ApiResponse<Slider>>("/sliders", data)
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateSlider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSliderRequest }) =>
      apiClient
        .patch<ApiResponse<Slider>>(`/sliders/${id}`, data)
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteSlider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/sliders/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUploadSliderImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      variant,
      file,
    }: {
      id: string;
      variant: SliderVariant;
      file: File;
    }) => {
      if (!SLIDER_IMAGE_ALLOWED_MIME.includes(file.type as SliderImageMime)) {
        throw new Error("فرمت تصویر باید JPEG، PNG یا WebP باشد");
      }
      if (file.size > SLIDER_IMAGE_MAX_BYTES) {
        throw new Error("حجم تصویر باید کمتر از ۵ مگابایت باشد");
      }

      const presign = await apiClient
        .post<ApiResponse<PresignResponse>>(`/sliders/${id}/image`, {
          action: "presign",
          variant,
          mimeType: file.type,
        })
        .then((r) => r.data.data);

      const putRes = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: presign.requiredHeaders,
        body: file,
      });
      if (!putRes.ok) throw new Error("آپلود فایل ناموفق بود");

      return apiClient
        .post<ApiResponse<Slider>>(`/sliders/${id}/image`, {
          action: "confirm",
          variant,
          mediaKey: presign.mediaKey,
          originalName: file.name,
        })
        .then((r) => r.data.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useRemoveSliderImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, variant }: { id: string; variant: SliderVariant }) =>
      apiClient
        .post<ApiResponse<{ removed: boolean }>>(`/sliders/${id}/image`, {
          action: "remove",
          variant,
        })
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
