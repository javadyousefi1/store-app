/**
 * Guest favorites live entirely in localStorage. Same tradeoff as the
 * guest cart: we persist a full product snapshot so the /favorites page
 * and heart states render without an extra network round-trip, at the
 * cost of the snapshot going stale if name/cover changes upstream.
 * The heart click on a fresh visit takes the newest snapshot anyway.
 */
export interface GuestFavoriteSnapshot {
  slug: string;
  name: string;
  coverUrl: string | null;
}

export interface GuestFavorite {
  productId: string;
  snapshot?: GuestFavoriteSnapshot;
  addedAt: string;
}

const STORAGE_KEY = "elina-guest-favorites";

export function getGuestFavorites(): GuestFavorite[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GuestFavorite[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setGuestFavorites(items: GuestFavorite[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addGuestFavorite(
  productId: string,
  snapshot?: GuestFavoriteSnapshot,
): GuestFavorite[] {
  const items = getGuestFavorites();
  const existing = items.find((item) => item.productId === productId);
  if (existing) {
    // Refresh the snapshot in case it changed between visits.
    const next = items.map((item) =>
      item.productId === productId
        ? { ...item, snapshot: snapshot ?? item.snapshot }
        : item,
    );
    setGuestFavorites(next);
    return next;
  }
  const next: GuestFavorite[] = [
    { productId, snapshot, addedAt: new Date().toISOString() },
    ...items,
  ];
  setGuestFavorites(next);
  return next;
}

export function removeGuestFavorite(productId: string): GuestFavorite[] {
  const next = getGuestFavorites().filter(
    (item) => item.productId !== productId,
  );
  setGuestFavorites(next);
  return next;
}

export function clearGuestFavorites() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
