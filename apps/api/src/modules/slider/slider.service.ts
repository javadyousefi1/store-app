import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Slider } from '../../entities/slider.entity';
import { CreateSliderDto } from './dto/create-slider.dto';
import { UpdateSliderDto } from './dto/update-slider.dto';
import { ImageAction, ImageVariant, SliderImageActionDto } from './dto/image-action.dto';
import { MediaService, PresignedUpload } from '../media/media.service';
import { StorageService } from '../../services/storage/storage.service';

type SliderWithUrls = Slider & { desktopImageUrl: string | null; mobileImageUrl: string | null };

@Injectable()
export class SliderService implements OnModuleInit {
  private readonly logger = new Logger(SliderService.name);

  constructor(
    @InjectRepository(Slider) private repo: Repository<Slider>,
    private mediaService: MediaService,
    private storageService: StorageService,
  ) {}

  /**
   * Slider images are embedded on the landing page, cached with Next ISR.
   * Presigned URLs would expire mid-cache and 403 for visitors — mark the
   * whole `sliders/*` prefix as public read.
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.storageService.setPublicReadPrefix('sliders');
    } catch (err: any) {
      this.logger.warn(
        `couldn't auto-configure MinIO public read for "sliders/*" — set it manually with ` +
          `\`mc anonymous set download myminio/<bucket>/sliders\`. reason: ${err?.message ?? err}`,
      );
    }
  }

  async findAllAdmin(): Promise<SliderWithUrls[]> {
    const rows = await this.repo.find({
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
      relations: ['desktopImage', 'mobileImage'],
    });
    return rows.map((r) => this.attachUrls(r));
  }

  async findAllActive(): Promise<SliderWithUrls[]> {
    const rows = await this.repo.find({
      where: { isActive: true },
      order: { sortOrder: 'ASC', createdAt: 'ASC' },
      relations: ['desktopImage', 'mobileImage'],
    });
    return rows.map((r) => this.attachUrls(r));
  }

  async findOneOrFail(id: string): Promise<Slider> {
    const row = await this.repo.findOne({ where: { id }, relations: ['desktopImage', 'mobileImage'] });
    if (!row) throw new NotFoundException('Slider not found');
    return row;
  }

  async create(dto: CreateSliderDto): Promise<Slider> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateSliderDto): Promise<SliderWithUrls> {
    const row = await this.findOneOrFail(id);
    Object.assign(row, dto);
    const saved = await this.repo.save(row);
    return this.attachUrls(saved);
  }

  async remove(id: string): Promise<void> {
    const row = await this.findOneOrFail(id);
    const desktopId = row.desktopImageId;
    const mobileId = row.mobileImageId;
    await this.repo.softDelete(id);
    if (desktopId) await this.mediaService.delete(desktopId).catch(() => {});
    if (mobileId) await this.mediaService.delete(mobileId).catch(() => {});
  }

  async handleImageAction(
    id: string,
    dto: SliderImageActionDto,
  ): Promise<PresignedUpload | SliderWithUrls | { removed: true }> {
    switch (dto.action) {
      case ImageAction.PRESIGN:
        return this.presignImage(id, dto.variant, dto.mimeType!);
      case ImageAction.CONFIRM:
        return this.confirmImage(id, dto.variant, dto.mediaKey!, dto.originalName);
      case ImageAction.REMOVE:
        await this.removeImage(id, dto.variant);
        return { removed: true };
    }
  }

  private async presignImage(id: string, variant: ImageVariant, mimeType: string): Promise<PresignedUpload> {
    await this.findOneOrFail(id);
    return this.mediaService.presignImageUpload(`sliders/${id}/${variant}`, mimeType);
  }

  private async confirmImage(
    id: string,
    variant: ImageVariant,
    mediaKey: string,
    originalName?: string,
  ): Promise<SliderWithUrls> {
    const row = await this.findOneOrFail(id);

    if (!mediaKey.startsWith(`sliders/${id}/${variant}/`)) {
      throw new BadRequestException('mediaKey does not belong to this slider/variant');
    }

    const previousId = variant === ImageVariant.DESKTOP ? row.desktopImageId : row.mobileImageId;
    const media = await this.mediaService.confirmImageUpload(mediaKey, originalName);

    if (variant === ImageVariant.DESKTOP) {
      row.desktopImageId = media.id;
      row.desktopImage = media;
    } else {
      row.mobileImageId = media.id;
      row.mobileImage = media;
    }
    await this.repo.save(row);

    if (previousId && previousId !== media.id) {
      await this.mediaService.delete(previousId).catch(() => {});
    }

    return this.attachUrls(row);
  }

  private async removeImage(id: string, variant: ImageVariant): Promise<void> {
    const row = await this.findOneOrFail(id);
    const currentId = variant === ImageVariant.DESKTOP ? row.desktopImageId : row.mobileImageId;
    if (!currentId) return;

    if (variant === ImageVariant.DESKTOP) {
      row.desktopImageId = null;
      row.desktopImage = null;
    } else {
      row.mobileImageId = null;
      row.mobileImage = null;
    }
    await this.repo.save(row);
    await this.mediaService.delete(currentId).catch(() => {});
  }

  private attachUrls(row: Slider): SliderWithUrls {
    const out = row as SliderWithUrls;
    out.desktopImageUrl = row.desktopImage ? this.storageService.publicUrl(row.desktopImage.key) : null;
    out.mobileImageUrl = row.mobileImage ? this.storageService.publicUrl(row.mobileImage.key) : null;
    return out;
  }
}
