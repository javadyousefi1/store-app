import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Story } from '../../entities/story.entity';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { StoryImageAction, StoryImageActionDto } from './dto/image-action.dto';
import { MediaService, PresignedUpload } from '../media/media.service';
import { StorageService } from '../../services/storage/storage.service';

type StoryWithUrl = Story & { imageUrl: string | null };

@Injectable()
export class StoryService implements OnModuleInit {
  private readonly logger = new Logger(StoryService.name);

  constructor(
    @InjectRepository(Story) private repo: Repository<Story>,
    private mediaService: MediaService,
    private storageService: StorageService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.storageService.setPublicReadPrefix('stories');
    } catch (err: any) {
      this.logger.warn(
        `couldn't auto-configure MinIO public read for "stories/*" — set it manually with ` +
          `\`mc anonymous set download myminio/<bucket>/stories\`. reason: ${err?.message ?? err}`,
      );
    }
  }

  async findAllAdmin(): Promise<StoryWithUrl[]> {
    const rows = await this.repo.find({
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
      relations: ['image'],
    });
    return rows.map((r) => this.attachUrl(r));
  }

  async findAllActive(): Promise<StoryWithUrl[]> {
    const rows = await this.repo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
      relations: ['image'],
    });
    return rows.map((r) => this.attachUrl(r));
  }

  async findOneOrFail(id: string): Promise<Story> {
    const row = await this.repo.findOne({ where: { id }, relations: ['image'] });
    if (!row) throw new NotFoundException('Story not found');
    return row;
  }

  async create(dto: CreateStoryDto): Promise<Story> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateStoryDto): Promise<StoryWithUrl> {
    const row = await this.findOneOrFail(id);
    Object.assign(row, dto);
    const saved = await this.repo.save(row);
    return this.attachUrl(saved);
  }

  async remove(id: string): Promise<void> {
    const row = await this.findOneOrFail(id);
    const imageId = row.imageId;
    await this.repo.softDelete(id);
    if (imageId) await this.mediaService.delete(imageId).catch(() => {});
  }

  async handleImageAction(
    id: string,
    dto: StoryImageActionDto,
  ): Promise<PresignedUpload | StoryWithUrl | { removed: true }> {
    switch (dto.action) {
      case StoryImageAction.PRESIGN:
        return this.presignImage(id, dto.mimeType!);
      case StoryImageAction.CONFIRM:
        return this.confirmImage(id, dto.mediaKey!, dto.originalName);
      case StoryImageAction.REMOVE:
        await this.removeImage(id);
        return { removed: true };
    }
  }

  private async presignImage(id: string, mimeType: string): Promise<PresignedUpload> {
    await this.findOneOrFail(id);
    return this.mediaService.presignImageUpload(`stories/${id}`, mimeType);
  }

  private async confirmImage(id: string, mediaKey: string, originalName?: string): Promise<StoryWithUrl> {
    const row = await this.findOneOrFail(id);

    if (!mediaKey.startsWith(`stories/${id}/`)) {
      throw new BadRequestException('mediaKey does not belong to this story');
    }

    const previousId = row.imageId;
    const media = await this.mediaService.confirmImageUpload(mediaKey, originalName);

    row.imageId = media.id;
    row.image = media;
    await this.repo.save(row);

    if (previousId && previousId !== media.id) {
      await this.mediaService.delete(previousId).catch(() => {});
    }

    return this.attachUrl(row);
  }

  private async removeImage(id: string): Promise<void> {
    const row = await this.findOneOrFail(id);
    const currentId = row.imageId;
    if (!currentId) return;

    row.imageId = null;
    row.image = null;
    await this.repo.save(row);
    await this.mediaService.delete(currentId).catch(() => {});
  }

  private attachUrl(row: Story): StoryWithUrl {
    const out = row as StoryWithUrl;
    out.imageUrl = row.image ? this.storageService.publicUrl(row.image.key) : null;
    return out;
  }
}
