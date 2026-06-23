import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3000";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${BACKEND_URL}/api/verifyOtp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();

  const token = data?.data?.accessToken;

  if (res.ok && token) {
    const response = NextResponse.json(data, { status: 200 });
    response.cookies.set("access_token", token, {
      httpOnly: true,
      secure: process.env.COOKIE_SECURE === "true",
      sameSite: "lax",
      path: "/",
      maxAge: 48 * 60 * 60, // 48 hours
    });
    return response;
  }

  return NextResponse.json(data, { status: res.status });
}
