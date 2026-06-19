import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { SettingsService } from '../settings/settings.service';

const BALE_API = 'https://tapi.bale.ai';

@Injectable()
export class BaleService {
  private readonly logger = new Logger(BaleService.name);

  constructor(private settingsService: SettingsService) {}

  async notifyNewProduct(productName: string, coverUrl: string, minPrice?: number): Promise<boolean> {
    const { tokenBaleBot } = await this.settingsService.get();
    if (!tokenBaleBot) {
      throw new BadRequestException('Bale token is not configured in settings');
    }

    this.logger.log(`Bale notify start — product: "${productName}"`);

    const chatIds = await this.getSubscriberChatIds(tokenBaleBot);
    if (!chatIds.length) {
      this.logger.warn('Bale notify skipped: no subscribers found');
      return false;
    }

    this.logger.log(`Bale sending to ${chatIds.length} subscriber(s): [${chatIds.join(', ')}]`);

    const priceText = minPrice != null
      ? `\n💰 قیمت از ${Number(minPrice).toLocaleString('fa-IR')} تومان`
      : '';
    const caption = [
      `✨ محصول جدید`,
      ``,
      `📦 ${productName}${priceText}`,
      ``,
      `🛒 همین الان سفارش بده!`,
    ].join('\n');

    const results = await Promise.allSettled(
      chatIds.map((id) => this.sendPhoto(tokenBaleBot, id, coverUrl, caption)),
    );

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.length - succeeded;
    this.logger.log(`Bale notify done — sent: ${succeeded}, failed: ${failed}`);
    return succeeded > 0;
  }

  private async getSubscriberChatIds(token: string): Promise<number[]> {
    try {
      this.logger.log('Bale fetching subscribers via getUpdates...');
      const res = await fetch(`${BALE_API}/bot${token}/getUpdates`);
      const data = await res.json() as { ok: boolean; result: Array<{ message?: { chat?: { id: number } } }> };

      this.logger.log(`Bale getUpdates response: ok=${data.ok}, updates=${data.result?.length ?? 0}`);

      if (!data.ok) {
        this.logger.warn(`Bale getUpdates returned ok=false`);
        return [];
      }

      const seen = new Set<number>();
      for (const update of data.result) {
        const id = update.message?.chat?.id;
        if (id != null) seen.add(id);
      }
      this.logger.log(`Bale unique chat IDs: ${seen.size}`);
      return [...seen];
    } catch (err) {
      this.logger.error(`Bale getUpdates threw: ${err.message}`, err.stack);
      return [];
    }
  }

  private async sendPhoto(token: string, chatId: number, photo: string, caption: string): Promise<void> {
    try {
      const res = await fetch(`${BALE_API}/bot${token}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, photo, caption }),
      });
      const body = await res.json();
      if (!body.ok) {
        this.logger.warn(`Bale sendPhoto to ${chatId} not ok: ${JSON.stringify(body)}`);
      } else {
        this.logger.log(`Bale sendPhoto to ${chatId} ✓`);
      }
    } catch (err) {
      this.logger.error(`Bale sendPhoto to ${chatId} threw: ${err.message}`, err.stack);
      throw err;
    }
  }
}
