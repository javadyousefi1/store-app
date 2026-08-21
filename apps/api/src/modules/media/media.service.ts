import { BadRequestException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { Media } from '../../entities/media.entity';
import { StorageService } from '../../services/storage/storage.service';

const ALLOWED_IMAGE_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MIME_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export interface PresignedUpload {
  mediaKey: string;
  uploadUrl: string;
  expiresIn: number;
  requiredHeaders: Record<string, string>;
}

@Injectable()
export class MediaService {
  constructor(
    @InjectRepository(Media) private repo: Repository<Media>,
    private storageService: StorageService,
  ) {}

  async upload(file: Express.Multer.File, folder: string): Promise<Media> {
    const ext = extname(file.originalname);
    const key = `${folder}/${randomUUID()}${ext}`;

    await this.storageService.upload(key, file.buffer, file.mimetype);

    return this.repo.save(
      this.repo.create({
        key,
        bucket: this.storageService.getBucket(),
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
      }),
    );
  }

  async presignImageUpload(
    folder: string,
    mimeType: string,
    expirySeconds = 600,
  ): Promise<PresignedUpload> {
    if (!ALLOWED_IMAGE_MIME.has(mimeType)) {
      throw new BadRequestException(
        `Unsupported mime type. Allowed: ${[...ALLOWED_IMAGE_MIME].join(', ')}`,
      );
    }

    const ext = MIME_EXT[mimeType];
    const mediaKey = `${folder}/${randomUUID()}${ext}`;
    const uploadUrl = await this.storageService.presignedPutUrl(mediaKey, expirySeconds);

    return {
      mediaKey,
      uploadUrl,
      expiresIn: expirySeconds,
      requiredHeaders: { 'Content-Type': mimeType },
    };
  }

  async confirmImageUpload(mediaKey: string, originalName?: string): Promise<Media> {
    let stat: { size: number; mimeType: string };
    try {
      stat = await this.storageService.statObject(mediaKey);
    } catch {
      throw new UnprocessableEntityException(
        'Uploaded object not found. PUT the file to the presigned URL before confirming.',
      );
    }

    if (!ALLOWED_IMAGE_MIME.has(stat.mimeType)) {
      await this.storageService.delete(mediaKey);
      throw new BadRequestException(
        `Uploaded object has unsupported mime type "${stat.mimeType}". File rejected.`,
      );
    }

    if (stat.size > MAX_UPLOAD_BYTES) {
      await this.storageService.delete(mediaKey);
      throw new BadRequestException(
        `Uploaded object exceeds ${MAX_UPLOAD_BYTES} bytes. File rejected.`,
      );
    }

    return this.repo.save(
      this.repo.create({
        key: mediaKey,
        bucket: this.storageService.getBucket(),
        originalName: originalName ?? mediaKey.split('/').pop() ?? mediaKey,
        mimeType: stat.mimeType,
        size: stat.size,
      }),
    );
  }

  async findById(id: string): Promise<Media | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findManyByIds(ids: string[]): Promise<Media[]> {
    if (!ids.length) return [];
    return this.repo.findBy({ id: In(ids) });
  }

  async delete(id: string): Promise<void> {
    const media = await this.repo.findOne({ where: { id } });
    if (!media) throw new NotFoundException('Media not found');

    await this.storageService.delete(media.key);
    await this.repo.delete(id);
  }

  async getUrl(media: Media): Promise<string> {
    return this.storageService.presignedGetUrl(media.key);
  }

  async enrichWithUrl<T extends { media: Media }>(item: T): Promise<T & { url: string }> {
    return { ...item, url: await this.getUrl(item.media) };
  }
}
