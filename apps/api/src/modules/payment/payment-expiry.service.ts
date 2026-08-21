import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';
import { PaymentService } from './payment.service';

/** Sweep cadence. Cheap query (indexed on status), fine to run every minute. */
const SWEEP_INTERVAL_MS = 60_000;

/**
 * Runs a periodic sweep that cancels INITIATED online-gateway payments left
 * dangling past the timeout window (shopper closed the tab, gateway page
 * timed out, browser crash). Kept as a plain setInterval so we don't need
 * `@nestjs/schedule` for a single job — swap this out if the app grows more
 * scheduled work.
 *
 * Idempotent: if a verify-callback wins the race, the sweep's own row lock +
 * status check make it a no-op.
 */
@Injectable()
export class PaymentExpiryService implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly logger = new Logger(PaymentExpiryService.name);
  private timer: NodeJS.Timeout | null = null;
  private running = false;

  constructor(private readonly paymentService: PaymentService) {}

  onApplicationBootstrap(): void {
    this.timer = setInterval(() => this.sweep(), SWEEP_INTERVAL_MS);
    // Node keeps the process alive while a repeating timer is scheduled;
    // unref so a hanging sweep never blocks a clean shutdown.
    this.timer.unref?.();
    this.logger.log(`Payment expiry sweep scheduled every ${SWEEP_INTERVAL_MS / 1000}s`);
  }

  onApplicationShutdown(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async sweep(): Promise<void> {
    // Don't stack sweeps if one takes longer than the interval (e.g. lock
    // contention). Skipping a tick is fine — the next one will pick up
    // anything still expired.
    if (this.running) return;
    this.running = true;
    try {
      await this.paymentService.expireStalePayments();
    } catch (err: any) {
      this.logger.error(`Sweep failed: ${err?.message ?? err}`);
    } finally {
      this.running = false;
    }
  }
}
