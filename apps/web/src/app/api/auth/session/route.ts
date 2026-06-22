import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { UserRole } from "@/types";

interface TokenPayload {
  phone?: string;
  role?: UserRole;
  exp?: number;
}

function decodePayload(token: string): TokenPayload | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    return JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as TokenPayload;
  } catch {
    return null;
  }
}

export async function GET() {
  const token = (await cookies()).get("access_token")?.value;
  const payload = token ? decodePayload(token) : null;
  const expired =
    typeof payload?.exp === "number" && payload.exp * 1000 <= Date.now();

  if (!payload?.phone || expired) {
    return NextResponse.json(
      { data: null, message: "Unauthenticated" },
      { status: 401 },
    );
  }

  return NextResponse.json({
    data: {
      phone: payload.phone,
      role: payload.role ?? "user",
    },
  });
}
