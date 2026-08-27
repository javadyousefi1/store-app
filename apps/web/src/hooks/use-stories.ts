"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import imageCompression from "browser-image-compression";
import apiClient from "@/lib/axios";
import type {
  ApiResponse,
  CreateStoryRequest,
  Story,
  UpdateStoryRequest,
} from "@/types";

const QUERY_KEY = ["stories", "admin"];

export const STORY_IMAGE_ALLOWED_MIME = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const STORY_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

type StoryImageMime = (typeof STORY_IMAGE_ALLOWED_MIME)[number];

interface PresignResponse {
  mediaKey: string;
  uploadUrl: string;
  expiresIn: number;
  requiredHeaders: Record<string, string>;
}

export function useStories() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: () =>
      apiClient
        .get<ApiResponse<Story[]>>("/stories/admin")
        .then((r) => r.data.data),
  });
}

export function useCreateStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateStoryRequest) =>
      apiClient
        .post<ApiResponse<Story>>("/stories", data)
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStoryRequest }) =>
      apiClient
        .patch<ApiResponse<Story>>(`/stories/${id}`, data)
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteStory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => apiClient.delete(`/stories/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

/**
 * Compresses to <= ~600KB, max 1080px on the longest side, WebP output.
 * Story assets don't need to be huge — Instagram shows them at ~1080×1920.
 * Returns the original file when it's already small + webp — avoids a needless
 * re-encode round-trip that can strip metadata browsers use for correct PUT.
 */
async function compressStoryImage(file: File): Promise<File> {
  if (file.type === "image/webp" && file.size <= 600 * 1024) {
    return file;
  }
  const compressed = await imageCompression(file, {
    maxSizeMB: 0.6,
    maxWidthOrHeight: 1080,
    useWebWorker: false,
    fileType: "image/webp",
    initialQuality: 0.82,
  });
  const baseName = file.name.replace(/\.[^.]+$/, "");
  return new File([compressed], `${baseName}.webp`, { type: "image/webp" });
}

export function useUploadStoryImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, file }: { id: string; file: File }) => {
      if (
        !STORY_IMAGE_ALLOWED_MIME.includes(file.type as StoryImageMime) &&
        !file.type.startsWith("image/")
      ) {
        throw new Error("فرمت تصویر باید JPEG، PNG یا WebP باشد");
      }
      if (file.size > STORY_IMAGE_MAX_BYTES) {
        throw new Error("حجم تصویر باید کمتر از ۵ مگابایت باشد");
      }

      const compressed = await compressStoryImage(file);
      if (compressed.size === 0) {
        throw new Error("فشرده‌سازی تصویر ناموفق بود (فایل خالی)");
      }
      console.log("[story-upload] compressed:", {
        name: compressed.name,
        type: compressed.type,
        size: compressed.size,
      });

      const presign = await apiClient
        .post<ApiResponse<PresignResponse>>(`/stories/${id}/image`, {
          action: "presign",
          mimeType: compressed.type,
        })
        .then((r) => r.data.data);
      console.log("[story-upload] presign:", {
        mediaKey: presign.mediaKey,
        uploadUrl: presign.uploadUrl,
        requiredHeaders: presign.requiredHeaders,
      });

      const putRes = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: presign.requiredHeaders,
        body: compressed,
      });
      console.log("[story-upload] PUT response:", {
        status: putRes.status,
        statusText: putRes.statusText,
        ok: putRes.ok,
        type: putRes.type,
      });
      if (!putRes.ok) {
        const body = await putRes.text().catch(() => "");
        throw new Error(
          `آپلود فایل ناموفق بود (HTTP ${putRes.status})${body ? `: ${body.slice(0, 200)}` : ""}`,
        );
      }

      return apiClient
        .post<ApiResponse<Story>>(`/stories/${id}/image`, {
          action: "confirm",
          mediaKey: presign.mediaKey,
          originalName: compressed.name,
        })
        .then((r) => r.data.data);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useRemoveStoryImage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient
        .post<ApiResponse<{ removed: boolean }>>(`/stories/${id}/image`, {
          action: "remove",
        })
        .then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
