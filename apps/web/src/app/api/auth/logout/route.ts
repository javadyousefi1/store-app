import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ message: "خروج موفق" });
  response.cookies.set("access_token", "", {
    httpOnly: true,
    secure: process.env.COOKIE_SECURE === "true",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
