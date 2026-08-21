const BACKEND = process.env.BACKEND_URL ?? "http://localhost:3000";

interface ApiFetchOptions extends Omit<RequestInit, "cache"> {
  /**
   * When set, opt into Next.js ISR: the response is cached and refreshed
   * at most once per `revalidate` seconds. Omit for the default
   * `cache: "no-store"` (live data — e.g. prices, stock).
   */
  revalidate?: number;
}

export async function apiFetch<T>(
  path: string,
  { revalidate, ...init }: ApiFetchOptions = {},
): Promise<T> {
  const fetchInit =
    revalidate !== undefined
      ? { ...init, next: { revalidate } }
      : { cache: "no-store" as const, ...init };
  const res = await fetch(`${BACKEND}${path}`, fetchInit);
  if (!res.ok) throw new Error(`API ${res.status}: ${path}`);
  const json = await res.json();
  return json.data;
}
