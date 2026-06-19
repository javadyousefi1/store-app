export function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fa-IR");
}

export function formatPrice(price: string | number) {
  return Number(price).toLocaleString("fa-IR");
}
