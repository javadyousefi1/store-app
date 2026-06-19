import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { extname } from 'path';
import { randomUUID } from 'crypto';
import { Media } from '../../entities/media.entity';
import { StorageService } from '../../services/storage/storage.service';

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
