import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3000";

type RouteParams = { params: Promise<{ path: string[] }> };

async function handler(req: NextRequest, { params }: RouteParams) {
  const { path } = await params;
  const backendPath = path.join("/");
  const search = req.nextUrl.search;
  const url = `${BACKEND_URL}/${backendPath}${search}`;

  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  console.log(`[PROXY] ${req.method} ${url}`);
  console.log(`[PROXY] token present: ${!!token}`);
  if (token) console.log(`[PROXY] token prefix: ${token.slice(0, 20)}...`);

  const headers = new Headers();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    headers.set("Content-Type", "application/json");
  }

  const body =
    req.method !== "GET" && req.method !== "HEAD"
      ? contentType.includes("multipart/form-data")
        ? await req.formData()
        : await req.text()
      : undefined;

  const res = await fetch(url, {
    method: req.method,
    headers,
    body: body as BodyInit | undefined,
  });

  const data = await res.text();
  console.log(`[PROXY] backend response status: ${res.status}`);

  return new NextResponse(data, {
    status: res.status,
    headers: { "Content-Type": res.headers.get("content-type") ?? "application/json" },
  });
}

export { handler as GET, handler as POST, handler as PATCH, handler as DELETE, handler as PUT };
