import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator';
import { CacheService } from '../../services/cache/cache.service';

@Injectable()
export class RateLimitGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private cacheService: CacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!options) return true;

    const request = context.switchToHttp().getRequest();

    const identifier: string =
      request.user?.id || request.body?.phone || request.headers['x-forwarded-for'] || request.ip;

    const prefix = options.keyPrefix || 'rl';
    const route = `${request.method}:${request.path}`;
    const key = `${prefix}:${route}:${identifier}`;

    const current = await this.cacheService.increment(key);

    if (current === 1) {
      await this.cacheService.expire(key, options.ttl);
    }

    if (current > options.limit) {
      const ttl = await this.cacheService.ttl(key);
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: 'Too Many Requests',
          message: `تعداد درخواست بیش از حد مجاز. ${ttl} ثانیه دیگر تلاش کنید`,
          retryAfter: ttl,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}
