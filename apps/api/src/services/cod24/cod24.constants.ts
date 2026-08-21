/**
 * Enum-like constants for the Cod24 API. Values map 1:1 to the numeric/string
 * ids Cod24 expects — do NOT renumber. When Cod24 adds a new carrier or
 * carton size, add a new entry here.
 */

/** `idTypeSend` — which carrier fulfills the shipment. */
export enum Cod24CarrierType {
  /** Iran Post — standard delivery. */
  IRAN_POST_REGULAR = 1,
  // Add TIPAX, PISHTAZ, etc. as Cod24 exposes their ids.
}

/** `idPayMethod` — how the customer paid. */
export enum Cod24PayMethod {
  ONLINE = 1,
}

/** `idPacketType` — envelope type. `NONE` means we're shipping a carton, not an envelope. */
export enum Cod24PacketType {
  NONE = 0,
}

/**
 * `idCartonType` — standard carton sizes. When the package is larger than
 * SIZE_9, pass the string {@link COD24_CARTON_ETC} instead.
 *
 * Dimensions (L × W × H, cm):
 *   1 → 15×10×10
 *   2 → 20×15×10  (fits A5)
 *   3 → 20×20×15  (fits A4)
 *   4 → 30×20×20  (fits A3)
 *   5 → 35×25×20
 *   6 → 45×25×20
 *   7 → 40×30×25
 *   8 → 45×40×30
 *   9 → 55×45×35
 */
export enum Cod24CartonType {
  SIZE_1 = 1,
  SIZE_2 = 2,
  SIZE_3 = 3,
  SIZE_4 = 4,
  SIZE_5 = 5,
  SIZE_6 = 6,
  SIZE_7 = 7,
  SIZE_8 = 8,
  SIZE_9 = 9,
}

/** Non-standard carton — pass this string instead of a number. */
export const COD24_CARTON_ETC = 'Etc' as const;
export type Cod24CartonInput = Cod24CartonType | typeof COD24_CARTON_ETC;

/** Default packaging fee (Rial) — Cod24 hard-codes this in the docs. */
export const COD24_PACKAGING_PRICE_RIAL = 22_000;

/** Default prepaid amount — always zero for our use case. */
export const COD24_PREPAID_RIAL = 0;

/** Redis keys. Token TTL should be slightly under Cod24's real 1h to avoid edge misses. */
export const COD24_TOKEN_CACHE_KEY  = 'cod24:token';
export const COD24_STATES_CACHE_KEY = 'cod24:states';
export const cod24CitiesCacheKey = (stateCode: number) => `cod24:cities:${stateCode}`;
