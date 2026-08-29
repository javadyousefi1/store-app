/**
 * Guest cart lives entirely in localStorage. To keep the UI usable
 * without a network round-trip, we persist a full snapshot of the
 * variant + product info at add-to-cart time. Snapshots go stale if
 * price / stock / name change on the server, but the tradeoff was
 * chosen deliberately — the checkout flow re-validates against the
 * server before the order lands, so stale display never becomes a
 * stale order.
 */
export interface GuestVariantSnapshot {
  price: string;
  sku: string;
  attributes: Record<string, string>;
  imageUrl: string | null;
  productId: string;
  productName: string;
  productSlug: string;
  productCoverUrl: string | null;
}

export interface GuestCartItem {
  variantId: string;
  quantity: number;
  snapshot?: GuestVariantSnapshot;
}

const STORAGE_KEY = "elina-guest-cart";

export function getGuestCartItems(): GuestCartItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as GuestCartItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function setGuestCartItems(items: GuestCartItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

export function addGuestCartItem(
  variantId: string,
  quantity: number,
  snapshot?: GuestVariantSnapshot,
): GuestCartItem[] {
  const items = getGuestCartItems();
  const existing = items.find((item) => item.variantId === variantId);

  const next = existing
    ? items.map((item) =>
        item.variantId === variantId
          ? {
              ...item,
              quantity: item.quantity + quantity,
              // Always take the latest snapshot when re-adding — the visitor
              // just saw fresh product info on the page.
              snapshot: snapshot ?? item.snapshot,
            }
          : item,
      )
    : [{ variantId, quantity, snapshot }, ...items];

  setGuestCartItems(next);
  return next;
}

export function clearGuestCart() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
