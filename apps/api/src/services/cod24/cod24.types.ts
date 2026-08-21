import {
  Cod24CarrierType,
  Cod24CartonInput,
  Cod24PacketType,
  Cod24PayMethod,
} from './cod24.constants';

// ─── Reference data ─────────────────────────────────────────────────────

export interface Cod24State {
  /** `statePostCode` from Cod24 — pass this as `stateCode` when fetching cities. */
  postCode: number;
  nameFa: string;
  nameEn: string;
  shortNameEn: string;
}

export interface Cod24City {
  /** Cod24 internal UUID — usually not needed downstream. */
  id: string;
  /** `cityCode` — the id used in quote/createOrder. */
  code: number;
  stateCode: number;
  nameFa: string;
  shortNameEn: string;
  isCenter: boolean;
}

// ─── Shipping quote ─────────────────────────────────────────────────────

export interface Cod24QuoteInput {
  /** Destination `cityCode` from {@link Cod24City.code}. */
  cityCode: number;
  /** Source/shop city code — where the parcel ships FROM. Defaults on the Cod24 side if omitted. */
  sourceCityCode?: number;
  weightGrams: number;
  /** Total product value in Toman. */
  productPriceRial: number;
  cartonType: Cod24CartonInput;
  fragile?: boolean;
  liquid?: boolean;
  nonStandardPackage?: boolean;
  /** Defaults to COD24_PACKAGING_PRICE_RIAL when omitted. */
  packagingPriceRial?: number;
  carrier?: Cod24CarrierType;
  payMethod?: Cod24PayMethod;
  packetType?: Cod24PacketType;
}

export interface Cod24QuoteResult {
  /** Base postage. */
  postPriceRial: number;
  /** Packaging fee (Cod24 spells this `packageingPrice` in the response — we normalize). */
  packagingPriceRial: number;
  /** Convenience — postage + packaging. */
  totalRial: number;
  raw: unknown;
}

// ─── Recipient + line items ─────────────────────────────────────────────

export interface Cod24Recipient {
  firstName: string;
  lastName: string;
  /** 11-digit Iranian mobile, e.g. "09121234567". */
  mobile: string;
  /** 10-digit postal code. */
  postalCode: string;
  /** Optional; empty string is fine. */
  nationalCode?: string;
  address: string;
  /** From {@link Cod24City.code}. */
  cityCode: number;
}

export interface Cod24ProductLine {
  /** Your item id (e.g. order-item UUID). Maps to `productUserCode`. */
  externalId: string;
  /** Display name — include variant attrs in parens, e.g. "پیراهن (رنگ:آبی-سایز:L)". */
  name: string;
  /** Weight of ONE unit, in grams. */
  weightGrams: number;
  count: number;
  /** Final paid amount for this line (unit price × count) in Rial. */
  finalPayAmountRial: number;
  /** Before-discount amount; leave undefined if you don't track it. */
  totalPayAmountRial?: number;
  /** Discount for this line; leave undefined if you don't track it. */
  totalOffAmountRial?: number;
}

// ─── Create order ───────────────────────────────────────────────────────

export interface Cod24CreateOrderInput {
  /**
   * Your order id (Cod24 stores it as `idOrderShop`). MUST be a string on
   * subsequent calls (per Cod24 docs) — we serialize it correctly for you.
   */
  externalOrderId: string;
  recipient: Cod24Recipient;
  totalWeightGrams: number;
  /** What the customer actually paid, in Rial. */
  finalPayAmountCustomerRial: number;
  /** Human description of package contents in Persian, e.g. "پوشاک". */
  contentsFa: string;
  products: Cod24ProductLine[];
  cartonType: Cod24CartonInput;
  description?: string;
  fragile?: boolean;
  liquid?: boolean;
  nonStandardPackage?: boolean;
  packagingPriceRial?: number;
  carrier?: Cod24CarrierType;
  payMethod?: Cod24PayMethod;
  packetType?: Cod24PacketType;
}

export interface Cod24CreateOrderResult {
  /** Cod24's own order id — persist this; every subsequent call needs it. */
  serial: number;
  raw: unknown;
}

// ─── Batch operations (suspend / readyToSend / getBarcodes) ────────────

export interface Cod24BatchInput {
  serial: number;
  /** `idOrderShop` — must be a string on the wire. */
  externalOrderId: string;
}

export interface Cod24BatchResult extends Cod24BatchInput {
  isSuccess: boolean;
  message: string | null;
}

export interface Cod24BarcodeResult extends Cod24BatchResult {
  cod24Barcode: string | null;
  /** The official post-office barcode — the one to show the shopper. */
  postBarcode: string | null;
  statusCode: number | null;
  statusTitle: string | null;
}

// ─── Print label ────────────────────────────────────────────────────────

export interface Cod24PrintLabelHandle {
  /** The endpoint that returns the actual PDF/HTML label. */
  linkAddress: string;
  /** One-shot bearer for the follow-up download call. */
  token: string;
  raw: unknown;
}

export interface Cod24LabelFile {
  bytes: Buffer;
  contentType: string;
}
