export type GuestCartItem = {
  variantId: string;
  quantity: number;
};

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
): GuestCartItem[] {
  const items = getGuestCartItems();
  const existing = items.find((item) => item.variantId === variantId);

  const next = existing
    ? items.map((item) =>
        item.variantId === variantId
          ? { ...item, quantity: item.quantity + quantity }
          : item,
      )
    : [...items, { variantId, quantity }];

  setGuestCartItems(next);
  return next;
}

export function clearGuestCart() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(STORAGE_KEY);
}
