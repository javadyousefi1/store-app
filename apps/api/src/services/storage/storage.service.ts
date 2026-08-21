import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  /** Talks to the actual MinIO server over the internal network. */
  private client: Minio.Client;
  /**
   * Signs presigned URLs against the public host (CDN / reverse proxy).
   * Falls back to `client` when no public host is configured. SigV4 hashes
   * the host, so the CDN MUST preserve the original `Host` header when
   * forwarding to MinIO — otherwise the signature won't validate.
   */
  private presigner: Minio.Client;
  private bucket: string;
  private ready = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.bucket = this.configService.get<string>('minio.bucket');
    const accessKey = this.configService.get<string>('minio.accessKey');
    const secretKey = this.configService.get<string>('minio.secretKey');

    this.client = new Minio.Client({
      endPoint: this.configService.get<string>('minio.endpoint'),
      port: this.configService.get<number>('minio.port'),
      useSSL: this.configService.get<boolean>('minio.useSSL'),
      accessKey,
      secretKey,
    });

    const publicEndpoint = this.configService.get<string>('minio.publicEndpoint');
    if (publicEndpoint) {
      const publicUseSSL = this.configService.get<boolean>('minio.publicUseSSL');
      const publicPort   = this.configService.get<number | undefined>('minio.publicPort');
      this.presigner = new Minio.Client({
        endPoint: publicEndpoint,
        // Omit port when the caller didn't set one so the SDK defaults to
        // 443/80 based on useSSL — matches a normal HTTPS URL without :443.
        ...(publicPort ? { port: publicPort } : {}),
        useSSL: publicUseSSL,
        accessKey,
        secretKey,
        // Explicit region skips the `getBucketLocation` HTTP call the SDK
        // would otherwise fire on first presign — that call would hit
        // publicEndpoint, which may not be reachable from the API host
        // (dev laptop, private network, etc). Also keeps the signature's
        // region segment matching the actual MinIO bucket region.
        region: this.configService.get<string>('minio.region') || 'us-east-1',
      });
      this.logger.log(
        `Presigned URLs will use public host ${publicUseSSL ? 'https' : 'http'}://${publicEndpoint}${publicPort ? `:${publicPort}` : ''}`,
      );
    } else {
      this.presigner = this.client;
    }

    try {
      await this.ensureBucket(this.bucket);
      this.ready = true;
    } catch (err) {
      this.logger.error(`MinIO connection failed: ${err.message}. Storage will be unavailable.`);
    }
  }

  async upload(key: string, buffer: Buffer, mimeType: string): Promise<void> {
    this.assertReady();
    await this.client.putObject(this.bucket, key, buffer, buffer.length, {
      'Content-Type': mimeType,
    });
  }

  async delete(key: string): Promise<void> {
    this.assertReady();
    await this.client.removeObject(this.bucket, key);
  }

  async presignedGetUrl(key: string, expirySeconds = 3600): Promise<string> {
    this.assertReady();
    return this.presigner.presignedGetObject(this.bucket, key, expirySeconds);
  }

  /**
   * Idempotently add a "public read" statement for a prefix to the bucket
   * policy. Callers use this on startup for prefixes whose objects must be
   * anonymously readable (e.g. article images embedded in HTML that Google
   * needs to crawl). Safe to call more than once — merges with existing
   * policy, doesn't duplicate the Sid.
   */
  async setPublicReadPrefix(prefix: string): Promise<void> {
    this.assertReady();
    const normalized = prefix.replace(/^\/+|\/+$/g, '');
    if (!normalized) throw new Error('prefix required');

    const sid = `PublicRead-${normalized.replace(/[^A-Za-z0-9]/g, '-')}`;
    const statement = {
      Sid:       sid,
      Effect:    'Allow',
      Principal: { AWS: ['*'] },
      Action:    ['s3:GetObject'],
      Resource:  [`arn:aws:s3:::${this.bucket}/${normalized}/*`],
    };

    let policy: { Version: string; Statement: unknown[] } = {
      Version: '2012-10-17',
      Statement: [],
    };
    try {
      const existing = await this.client.getBucketPolicy(this.bucket);
      if (existing) policy = JSON.parse(existing);
    } catch (err: any) {
      // "The bucket policy does not exist" is fine — we're about to create one.
      const msg = String(err?.code ?? err?.message ?? '');
      if (!/NoSuchBucketPolicy/i.test(msg)) throw err;
    }

    const already = (policy.Statement ?? []).some(
      (s) => (s as { Sid?: string })?.Sid === sid,
    );
    if (already) {
      this.logger.log(`bucket policy already grants public read on "${normalized}/*"`);
      return;
    }

    policy.Statement = [...(policy.Statement ?? []), statement];
    await this.client.setBucketPolicy(this.bucket, JSON.stringify(policy));
    this.logger.log(`granted public read on "${this.bucket}/${normalized}/*"`);
  }

  /**
   * Build a NON-SIGNED, permanent public URL for a stored object. Only use
   * for objects that live under a bucket prefix explicitly configured for
   * public read (see `setPublicReadPrefix`) — e.g. `articles/*` for blog
   * images that Google needs to crawl. Signed URLs expire; embedding an
   * expiring URL in an HTML article body breaks the page after ~1 hour.
   */
  publicUrl(key: string): string {
    const publicEndpoint = this.configService.get<string>('minio.publicEndpoint');
    const publicUseSSL   = this.configService.get<boolean>('minio.publicUseSSL');
    const publicPort     = this.configService.get<number | undefined>('minio.publicPort');

    // Fall back to the internal endpoint if no public host is configured —
    // works for dev where MinIO is on localhost.
    const host   = publicEndpoint || this.configService.get<string>('minio.endpoint');
    const useSSL = publicEndpoint
      ? publicUseSSL
      : this.configService.get<boolean>('minio.useSSL');
    const port = publicEndpoint
      ? publicPort
      : this.configService.get<number>('minio.port');

    const scheme  = useSSL ? 'https' : 'http';
    const suffix  = port && !(useSSL && port === 443) && !(!useSSL && port === 80)
      ? `:${port}`
      : '';
    return `${scheme}://${host}${suffix}/${this.bucket}/${key}`;
  }

  async presignedPutUrl(key: string, expirySeconds = 600): Promise<string> {
    this.assertReady();
    return this.presigner.presignedPutObject(this.bucket, key, expirySeconds);
  }

  async statObject(key: string): Promise<{ size: number; mimeType: string }> {
    this.assertReady();
    const stat = await this.client.statObject(this.bucket, key);
    return {
      size: stat.size,
      mimeType: stat.metaData?.['content-type'] ?? 'application/octet-stream',
    };
  }

  getBucket(): string {
    return this.bucket;
  }

  isReady(): boolean {
    return this.ready;
  }

  private assertReady() {
    if (!this.ready) {
      throw new ServiceUnavailableException('Storage service is not available');
    }
  }

  private async ensureBucket(bucket: string): Promise<void> {
    const exists = await this.client.bucketExists(bucket);
    if (!exists) {
      await this.client.makeBucket(bucket);
      this.logger.log(`Bucket "${bucket}" created`);
    } else {
      this.logger.log(`Bucket "${bucket}" already exists`);
    }
  }
}
