import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../cache/cache.service';
import { Cod24Client } from './cod24.client';
import { Cod24Error, parseCod24ErrorBody } from './cod24.errors';
import {
  COD24_PACKAGING_PRICE_RIAL,
  COD24_PREPAID_RIAL,
  COD24_STATES_CACHE_KEY,
  cod24CitiesCacheKey,
  Cod24CarrierType,
  Cod24PacketType,
  Cod24PayMethod,
} from './cod24.constants';
import {
  Cod24BarcodeResult,
  Cod24BatchInput,
  Cod24BatchResult,
  Cod24City,
  Cod24CreateOrderInput,
  Cod24CreateOrderResult,
  Cod24LabelFile,
  Cod24PrintLabelHandle,
  Cod24QuoteInput,
  Cod24QuoteResult,
  Cod24State,
} from './cod24.types';

// ── Raw response shapes (Cod24 wire format) ────────────────────────────

interface RawState {
  statePostCode: number;
  stateNameFa: string;
  stateNameEn: string;
  shortNameEn: string;
}

interface RawCity {
  id: string;
  cityCode: number;
  stateCode: number;
  cityNameFa: string;
  shortNameEn: string;
  isCenter: boolean;
}

interface RawQuoteResponse {
  totalPostPrice: number;
  /** Cod24 typo — actual field name. */
  packageingPrice?: number;
  /** In case Cod24 ever fixes the typo. */
  packagingPrice?: number;
}

interface RawCreateOrderResponse {
  isSuccess: boolean;
  serial: number;
  message: string | null;
}

interface RawBatchResult {
  serial: number;
  isSuccess: boolean;
  message: string | null;
  idOrderShop?: string;
}

interface RawBarcodeResult extends RawBatchResult {
  cod24Barcode: string | null;
  postBarcode: string | null;
  statusCode: number | null;
  statusTitle: string | null;
  code?: number;
}

interface RawPrintLabelResponse {
  isSuccess: boolean;
  linkAddress: string;
  token: string;
  message?: string | null;
}

/**
 * Cod24 aggregator client — provides Iran Post, Tipax, and other carriers
 * via one HTTP surface. This service is the ONLY layer other code should
 * touch; it delegates transport to {@link Cod24Client}.
 *
 * All prices are in Rial. All weights are in grams. All `idOrderShop`
 * values are serialized as strings on the wire, even when the caller
 * passes a numeric-looking string — Cod24 rejects numbers.
 */
@Injectable()
export class Cod24Service {
  private readonly logger = new Logger(Cod24Service.name);
  private readonly stateCacheTtl: number;

  constructor(
    private readonly client: Cod24Client,
    private readonly config: ConfigService,
    private readonly cache: CacheService,
  ) {
    this.stateCacheTtl = this.config.get<number>('cod24.stateCacheTtlSeconds') ?? 604_800;
  }

  // ── Reference data ─────────────────────────────────────────────────────

  async listStates(): Promise<Cod24State[]> {
    const cached = await this.cache.get<Cod24State[]>(COD24_STATES_CACHE_KEY);
    if (cached?.length) return cached;

    const raw = await this.client.post<RawState[]>('/State/getStates', {});
    const states = (raw ?? []).map(this.mapState);
    await this.cache.set(COD24_STATES_CACHE_KEY, states, this.stateCacheTtl);
    return states;
  }

  async listCities(stateCode: number): Promise<Cod24City[]> {
    const key = cod24CitiesCacheKey(stateCode);
    const cached = await this.cache.get<Cod24City[]>(key);
    if (cached?.length) return cached;

    const raw = await this.client.post<RawCity[]>('/City/getCities', { stateCode });
    const cities = (raw ?? []).map(this.mapCity);
    await this.cache.set(key, cities, this.stateCacheTtl);
    return cities;
  }

  /**
   * Drop cached states/cities. Call after a Cod24 reference-data update or
   * when a city lookup returns nothing you expected.
   */
  async invalidateReferenceCache(stateCode?: number): Promise<void> {
    if (stateCode !== undefined) {
      await this.cache.del(cod24CitiesCacheKey(stateCode));
      return;
    }
    await this.cache.del(COD24_STATES_CACHE_KEY);
  }

  // ── Quote ──────────────────────────────────────────────────────────────

  async quotePostage(input: Cod24QuoteInput): Promise<Cod24QuoteResult> {
    const packagingPrice = input.packagingPriceRial ?? COD24_PACKAGING_PRICE_RIAL;

    const body: Record<string, unknown> = {
      cityCode:            input.cityCode,
      weight:              input.weightGrams,
      price:               input.productPriceRial,
      prePaidPrice:        COD24_PREPAID_RIAL,
      idTypeSend:          input.carrier    ?? Cod24CarrierType.IRAN_POST_REGULAR,
      idPayMethod:         input.payMethod  ?? Cod24PayMethod.ONLINE,
      nonStandardPackage:  input.nonStandardPackage ?? false,
      packagingPrice,
      idCartonType:        input.cartonType,
      idPacketType:        input.packetType ?? Cod24PacketType.NONE,
      fragile:             input.fragile    ?? false,
      liquid:              input.liquid     ?? false,
    };
    if (input.sourceCityCode !== undefined) {
      body.sourceCityCode = input.sourceCityCode;
    }

    const raw = await this.client.post<RawQuoteResponse>('/Order/getPostPrice', body);
    // Cod24 spells this `packageingPrice` in the response — normalize.
    const packaging = raw.packagingPrice ?? raw.packageingPrice ?? packagingPrice;
    const postage   = raw.totalPostPrice ?? 0;

    return {
      postPriceRial: postage,
      packagingPriceRial: packaging,
      totalRial: postage + packaging,
      raw,
    };
  }

  // ── Create order (returns serial) ──────────────────────────────────────

  async createOrder(input: Cod24CreateOrderInput): Promise<Cod24CreateOrderResult> {
    const packagingPrice = input.packagingPriceRial ?? COD24_PACKAGING_PRICE_RIAL;

    const body = {
      idOrder:                 null,
      cityCode:                input.recipient.cityCode,
      idTypeSend:              input.carrier    ?? Cod24CarrierType.IRAN_POST_REGULAR,
      idPayMethod:             input.payMethod  ?? Cod24PayMethod.ONLINE,
      description:             input.description ?? null,
      firstName:               input.recipient.firstName,
      lastName:                input.recipient.lastName,
      mobile:                  input.recipient.mobile,
      postalCode:              input.recipient.postalCode,
      nationalCode:            input.recipient.nationalCode ?? '',
      address:                 input.recipient.address,
      nonStandardPackage:      input.nonStandardPackage ?? false,
      finalPayAmountCustomer:  input.finalPayAmountCustomerRial,
      totalWeight:             input.totalWeightGrams,
      // Cod24 requires string — enforce it here so callers can't accidentally
      // pass a number.
      idOrderShop:             String(input.externalOrderId),
      packagingPrice,
      contentParcell:          input.contentsFa,
      idCartonType:            input.cartonType,
      idPacketType:            input.packetType ?? Cod24PacketType.NONE,
      fragile:                 input.fragile ?? false,
      liquid:                  input.liquid  ?? false,
      prePrintBarcode:         null,
      requestOrderProducts:    input.products.map((p) => ({
        productUserCode: p.externalId,
        productName:     p.name,
        weight:          p.weightGrams,
        count:           p.count,
        totalOffAmount:  p.totalOffAmountRial ?? 0,
        totalPayAmount:  p.totalPayAmountRial ?? 0,
        finalPayAmount:  p.finalPayAmountRial,
      })),
    };

    const raw = await this.client.post<RawCreateOrderResponse>('/Order/addOrder', body);
    if (!raw?.isSuccess || !raw.serial) {
      throw new Cod24Error('/Order/addOrder', 200, [raw?.message ?? 'addOrder returned isSuccess=false'], raw);
    }

    this.logger.log(`order created externalId=${input.externalOrderId} serial=${raw.serial}`);
    return { serial: raw.serial, raw };
  }

  // ── Batch: suspend / readyToSend / getBarcodes ──────────────────────────

  async confirmOrder(items: Cod24BatchInput[]): Promise<Cod24BatchResult[]> {
    const raw = await this.client.post<RawBatchResult[]>('/Order/suspendOrder', this.toBatchWireFormat(items));
    return this.mapBatchResult(items, raw);
  }

  async markReadyToSend(items: Cod24BatchInput[]): Promise<Cod24BatchResult[]> {
    const raw = await this.client.post<RawBatchResult[]>('/Order/readyToSend', this.toBatchWireFormat(items));
    return this.mapBatchResult(items, raw);
  }

  async getBarcodes(items: Cod24BatchInput[]): Promise<Cod24BarcodeResult[]> {
    const raw = await this.client.post<RawBarcodeResult[]>('/Order/getBarcodes', this.toBatchWireFormat(items));
    const results = Array.isArray(raw) ? raw : [];
    return items.map((item) => {
      const found = results.find((r) => r?.serial === item.serial);
      return {
        serial:          item.serial,
        externalOrderId: item.externalOrderId,
        isSuccess:       found?.isSuccess ?? false,
        message:         found?.message ?? null,
        cod24Barcode:    found?.cod24Barcode ?? null,
        postBarcode:     found?.postBarcode ?? null,
        statusCode:      found?.statusCode ?? null,
        statusTitle:     found?.statusTitle ?? null,
      };
    });
  }

  // ── Print label ────────────────────────────────────────────────────────

  async getPrintLabel(serial: number): Promise<Cod24PrintLabelHandle> {
    const raw = await this.client.post<RawPrintLabelResponse>('/Print/factorPreview', [{ serial }]);
    if (!raw?.isSuccess || !raw.linkAddress || !raw.token) {
      throw new Cod24Error('/Print/factorPreview', 200, [raw?.message ?? 'factorPreview returned isSuccess=false'], raw);
    }
    return { linkAddress: raw.linkAddress, token: raw.token, raw };
  }

  /**
   * Follow the {@link Cod24PrintLabelHandle} to actually download the label.
   * Content is provider-defined (usually PDF, sometimes HTML) — we return
   * bytes + content-type and let the caller decide what to do with them.
   */
  async downloadPrintLabel(handle: Cod24PrintLabelHandle): Promise<Cod24LabelFile> {
    const res = await this.client.postRaw('/Print/factorPreview', undefined, {
      absoluteUrl: handle.linkAddress,
      anonymous:   true,   // this hop uses its own one-shot bearer, not the account token
      headers:     { authorization: `Bearer ${handle.token}` },
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Cod24Error(handle.linkAddress, res.status, parseCod24ErrorBody(text) || [`HTTP ${res.status}`], text.slice(0, 500));
    }

    const contentType = res.headers.get('content-type') ?? 'application/octet-stream';
    const buffer      = Buffer.from(await res.arrayBuffer());
    return { bytes: buffer, contentType };
  }

  // ── Private mappers ────────────────────────────────────────────────────

  private mapState = (s: RawState): Cod24State => ({
    postCode:    s.statePostCode,
    nameFa:      s.stateNameFa,
    nameEn:      s.stateNameEn,
    shortNameEn: s.shortNameEn,
  });

  private mapCity = (c: RawCity): Cod24City => ({
    id:          c.id,
    code:        c.cityCode,
    stateCode:   c.stateCode,
    nameFa:      c.cityNameFa,
    shortNameEn: c.shortNameEn,
    isCenter:    c.isCenter,
  });

  private toBatchWireFormat(items: Cod24BatchInput[]): Array<{ serial: number; idOrderShop: string }> {
    return items.map((i) => ({
      serial:      i.serial,
      idOrderShop: String(i.externalOrderId),
    }));
  }

  private mapBatchResult(
    items: Cod24BatchInput[],
    raw: RawBatchResult[] | null | undefined,
  ): Cod24BatchResult[] {
    const results = Array.isArray(raw) ? raw : [];
    return items.map((item) => {
      const found = results.find((r) => r?.serial === item.serial);
      return {
        serial:          item.serial,
        externalOrderId: item.externalOrderId,
        isSuccess:       found?.isSuccess ?? false,
        message:         found?.message ?? null,
      };
    });
  }
}
