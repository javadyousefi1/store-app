const BACKEND = process.env.BACKEND_URL ?? "http://localhost:3000";

export async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BACKEND}${path}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  const json = await res.json();
  return json.data;
}
