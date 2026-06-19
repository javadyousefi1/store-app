import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as Minio from 'minio';

@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private client: Minio.Client;
  private bucket: string;
  private ready = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    this.bucket = this.configService.get<string>('minio.bucket');

    this.client = new Minio.Client({
      endPoint: this.configService.get<string>('minio.endpoint'),
      port: this.configService.get<number>('minio.port'),
      useSSL: this.configService.get<boolean>('minio.useSSL'),
      accessKey: this.configService.get<string>('minio.accessKey'),
      secretKey: this.configService.get<string>('minio.secretKey'),
    });

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
    return  this.client.presignedGetObject(this.bucket, key, expirySeconds);
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
