import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../cache/cache.service';
import { COD24_TOKEN_CACHE_KEY } from './cod24.constants';
import {
  Cod24ConfigError,
  Cod24Error,
  parseCod24ErrorBody,
} from './cod24.errors';

interface TokenResponse {
  token?: string;
}

interface RequestOptions {
  /** Skip the Authorization header (only /Account/getToken uses this). */
  anonymous?: boolean;
  /** Full URL override — used for the print-label follow-up call. */
  absoluteUrl?: string;
  /** Extra headers to merge into the request. */
  headers?: Record<string, string>;
  /**
   * Return the raw Response instead of parsing JSON. Used for the label
   * download where the body is a binary file, not JSON.
   */
  raw?: true;
}

/** Node-side network error codes we consider transient. */
const RETRYABLE_NETWORK_CODES = new Set([
  'EAI_AGAIN',
  'ENOTFOUND',
  'ETIMEDOUT',
  'ECONNREFUSED',
  'ECONNRESET',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_SOCKET',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_BODY_TIMEOUT',
  'ABORT_ERR',
]);

const MAX_ATTEMPTS  = 3;
const BASE_DELAY_MS = 1000;

/** Sentinel thrown by the inner call so the outer wrapper can refresh + retry once. */
class UnauthorizedSignal extends Error {
  constructor() {
    super('cod24 401 — token needs refresh');
    this.name = 'UnauthorizedSignal';
  }
}

/**
 * Low-level HTTP client for the Cod24 API. Handles:
 *   - Bearer token: fetched on demand, cached in Redis, refreshed on 401 once.
 *   - Retries: exponential backoff for transient network errors and 5xx.
 *   - Errors: normalizes Cod24's two error shapes into {@link Cod24Error}.
 *
 * Keep this file transport-only — no business logic. `Cod24Service` layers
 * the domain concepts on top.
 */
@Injectable()
export class Cod24Client {
  private readonly logger = new Logger(Cod24Client.name);
  private readonly baseUrl: string;
  private readonly timeoutMs: number;
  private readonly tokenTtlSeconds: number;

  constructor(
    private readonly config: ConfigService,
    private readonly cache: CacheService,
  ) {
    this.baseUrl        = String(this.config.get<string>('cod24.baseUrl') ?? '').replace(/\/+$/, '');
    this.timeoutMs      = this.config.get<number>('cod24.timeoutMs')      ?? 30_000;
    this.tokenTtlSeconds = this.config.get<number>('cod24.tokenTtlSeconds') ?? 3300;
  }

  // ── Public JSON call ────────────────────────────────────────────────────

  async post<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    // Try once; on 401 refresh the token and try again — do NOT count the
    // refresh against the network-retry budget.
    try {
      return await this.attempt<T>(path, body, options);
    } catch (err) {
      if (!(err instanceof UnauthorizedSignal)) throw err;

      this.logger.warn(`[${path}] token rejected (401) — refreshing and retrying`);
      await this.cache.del(COD24_TOKEN_CACHE_KEY);
      try {
        return await this.attempt<T>(path, body, options);
      } catch (err2) {
        if (err2 instanceof UnauthorizedSignal) {
          throw new Cod24Error(
            path,
            401,
            ['authentication failed even with a fresh token — check COD24_USERNAME / COD24_PASSWORD'],
          );
        }
        throw err2;
      }
    }
  }

  /**
   * Fire an arbitrary Response fetch against Cod24 (used for the label
   * download step where the body isn't JSON). Same retry + auth semantics.
   */
  async postRaw(path: string, body: unknown, options?: RequestOptions): Promise<Response> {
    return this.post<Response>(path, body, { ...options, raw: true });
  }

  // ── Auth ────────────────────────────────────────────────────────────────

  private async ensureToken(): Promise<string> {
    const cached = await this.cache.get<string>(COD24_TOKEN_CACHE_KEY);
    if (cached) return cached;
    return this.refreshToken();
  }

  private async refreshToken(): Promise<string> {
    const userName = this.config.get<string>('cod24.username');
    const password = this.config.get<string>('cod24.password');
    if (!userName || !password) {
      throw new Cod24ConfigError('COD24_USERNAME / COD24_PASSWORD are required');
    }

    const res = await this.attempt<TokenResponse>('/Account/getToken', { userName, password }, {
      anonymous: true,
    });
    const token = res?.token?.trim();
    if (!token) {
      throw new Cod24Error('/Account/getToken', 200, ['login succeeded but response contained no token'], res);
    }
    await this.cache.set(COD24_TOKEN_CACHE_KEY, token, this.tokenTtlSeconds);
    this.logger.log('token refreshed');
    return token;
  }

  // ── Attempt (single logical call, wrapped in retry) ─────────────────────

  private async attempt<T>(path: string, body: unknown, options?: RequestOptions): Promise<T> {
    return this.withNetworkRetry(async (attempt) => {
      const url = options?.absoluteUrl ?? `${this.baseUrl}${path}`;

      const headers: Record<string, string> = {
        'content-type': 'application/json',
        accept: 'application/json',
        ...(options?.headers ?? {}),
      };
      if (!options?.anonymous) {
        const token = await this.ensureToken();
        headers.authorization = `Bearer ${token}`;
      }

      const controller = new AbortController();
      const timeout    = setTimeout(() => controller.abort(), this.timeoutMs);

      let response: Response;
      try {
        response = await fetch(url, {
          method:  'POST',
          headers,
          body:    body === undefined ? undefined : JSON.stringify(body),
          signal:  controller.signal,
        });
      } finally {
        clearTimeout(timeout);
      }

      // 401 is handled ONE level up (token refresh). Signal, don't retry here.
      if (response.status === 401 && !options?.anonymous) {
        throw new UnauthorizedSignal();
      }

      // Retryable server error — throw so the retry wrapper catches it.
      if (response.status >= 500 && response.status <= 599) {
        const text = await response.text().catch(() => '');
        throw new RetryableHttpError(path, response.status, text, attempt);
      }

      if (options?.raw) return response as unknown as T;

      const text = await response.text();
      const parsed = this.safeJson(text);

      if (!response.ok) {
        const messages = parseCod24ErrorBody(parsed);
        throw new Cod24Error(path, response.status, messages.length ? messages : [`HTTP ${response.status}`], parsed ?? text.slice(0, 500));
      }

      return (parsed ?? null) as T;
    });
  }

  // ── Retry wrapper ───────────────────────────────────────────────────────

  private async withNetworkRetry<T>(fn: (attempt: number) => Promise<T>): Promise<T> {
    let lastErr: unknown;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        return await fn(attempt);
      } catch (err) {
        // UnauthorizedSignal / Cod24Error / Cod24ConfigError are terminal —
        // bubble up immediately without eating attempts.
        if (err instanceof UnauthorizedSignal) throw err;
        if (err instanceof Cod24Error)         throw err;
        if (err instanceof Cod24ConfigError)   throw err;
        if (!this.isRetryable(err)) throw err;

        lastErr = err;
        if (attempt < MAX_ATTEMPTS) {
          const delay = BASE_DELAY_MS * 2 ** (attempt - 1);
          this.logger.warn(`transient error on attempt ${attempt}/${MAX_ATTEMPTS} — retrying in ${delay}ms: ${describe(err)}`);
          await sleep(delay);
        }
      }
    }
    // Exhausted retries — throw a proper Cod24Error the caller can act on.
    if (lastErr instanceof RetryableHttpError) {
      throw new Cod24Error(lastErr.path, lastErr.status, [`upstream ${lastErr.status} after ${MAX_ATTEMPTS} attempts`], lastErr.body);
    }
    const detail = describe(lastErr);
    this.logger.error(`network error after ${MAX_ATTEMPTS} attempts: ${detail}`);
    throw new Cod24Error('network', 0, [detail || 'network unreachable'], lastErr);
  }

  private isRetryable(err: unknown): boolean {
    if (err instanceof RetryableHttpError) return true;
    // undici / node fetch wraps the syscall error under `.cause`.
    const anyErr = err as { code?: string; name?: string; cause?: { code?: string; name?: string } };
    const code = anyErr?.code ?? anyErr?.cause?.code;
    if (code && RETRYABLE_NETWORK_CODES.has(code)) return true;
    const name = anyErr?.name ?? anyErr?.cause?.name;
    if (name === 'AbortError' || name === 'TimeoutError') return true;
    return false;
  }

  // ── Helpers ────────────────────────────────────────────────────────────

  private safeJson(text: string): unknown | null {
    if (!text) return null;
    try { return JSON.parse(text); } catch { return null; }
  }
}

/** Internal sentinel for 5xx responses — bumps the retry attempt counter. */
class RetryableHttpError extends Error {
  constructor(
    public readonly path: string,
    public readonly status: number,
    public readonly body: string,
    public readonly attempt: number,
  ) {
    super(`cod24 ${path} → HTTP ${status}`);
    this.name = 'RetryableHttpError';
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function describe(err: unknown): string {
  if (!err) return 'unknown';
  const anyErr = err as { message?: string; code?: string; cause?: { message?: string; code?: string } };
  const parts = [
    anyErr?.message,
    anyErr?.code                       && `code=${anyErr.code}`,
    anyErr?.cause?.code                && `cause=${anyErr.cause.code}`,
    anyErr?.cause?.message && anyErr.cause.message !== anyErr.message && `causeMessage="${anyErr.cause.message}"`,
  ].filter(Boolean);
  return parts.join(' ');
}
