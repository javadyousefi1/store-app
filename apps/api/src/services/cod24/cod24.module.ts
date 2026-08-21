import { Module } from '@nestjs/common';
import { Cod24Client } from './cod24.client';
import { Cod24Service } from './cod24.service';

/**
 * Shipping-aggregator (Cod24) module. Ships in isolation — is intentionally
 * NOT imported by AppModule yet. Any consumer that needs shipping just
 * imports { Cod24Module } and injects { Cod24Service }.
 *
 * Depends on the global CacheModule (already registered by AppModule) for
 * token + reference-data caching.
 */
@Module({
  providers: [Cod24Client, Cod24Service],
  exports: [Cod24Service],
})
export class Cod24Module {}
