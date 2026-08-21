import { BadGatewayException, InternalServerErrorException } from '@nestjs/common';

/**
 * Cod24 rejected our request. Maps to HTTP 502 so ops can tell "upstream
 * fault" from "our fault" in logs. `messages` holds one or more human-
 * readable diagnostics extracted from Cod24's error body — see
 * {@link parseCod24ErrorBody}.
 */
export class Cod24Error extends BadGatewayException {
  constructor(
    public readonly endpoint: string,
    public readonly httpStatus: number,
    public readonly messages: string[],
    public readonly rawResponse?: unknown,
  ) {
    const detail = messages.length ? messages.join('; ') : `HTTP ${httpStatus}`;
    super(`[cod24] ${endpoint} — ${detail}`);
  }
}

/**
 * Thrown when required Cod24 config is missing (no username/password) or
 * clearly invalid. Distinct from Cod24Error because retrying can't help.
 */
export class Cod24ConfigError extends InternalServerErrorException {
  constructor(reason: string) {
    super(`[cod24] misconfigured: ${reason}`);
  }
}

/**
 * Normalize Cod24's two documented error shapes:
 *   - array:  [{ message: '...' }, { message: '...' }]
 *   - object: { message: '...' }
 *
 * Returns an empty array when nothing useful can be extracted — callers
 * should fall back to a status-based message.
 */
export function parseCod24ErrorBody(body: unknown): string[] {
  if (!body) return [];
  const bag = Array.isArray(body) ? body : [body];
  const out: string[] = [];
  for (const item of bag) {
    if (!item || typeof item !== 'object') continue;
    const message = (item as { message?: unknown }).message;
    if (typeof message === 'string' && message.trim()) out.push(message.trim());
  }
  return out;
}
