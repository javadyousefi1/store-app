import {ConflictException, Injectable, NotFoundException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {randomBytes} from 'crypto';
import {Repository} from 'typeorm';
import {Product} from '../../entities/product.entity';
import {ProductVariant} from '../../entities/product-variant.entity';
import {AttributeService} from '../attribute/attribute.service';
import {MediaService} from '../media/media.service';
import {BaleService} from '../bale/bale.service';
import {PaginateResult} from '../../common/interfaces/paginate-result.interface';
import {CreateProductDto} from './dto/create-product.dto';
import {UpdateProductDto} from './dto/update-product.dto';
import {CreateVariantDto} from './dto/create-variant.dto';
import {UpdateVariantDto} from './dto/update-variant.dto';
import {GetProductsDto} from './dto/get-products.dto';
import {RestockNotificationService} from '../restock-notification/restock-notification.service';

@Injectable()
export class ProductService {
    constructor(
        @InjectRepository(Product) private productRepo: Repository<Product>,
        @InjectRepository(ProductVariant) private variantRepo: Repository<ProductVariant>,
        private attributeService: AttributeService,
        private mediaService: MediaService,
        private baleService: BaleService,
        private restockService: RestockNotificationService,
    ) {
    }

    // ── Products ──────────────────────────────────────────────────────────────

    async findAll(dto: GetProductsDto): Promise<PaginateResult<Product>> {
        const priceSummary = this.variantRepo
            .createQueryBuilder('priceVariant')
            .select('priceVariant.productId', 'productId')
            .addSelect('MIN(priceVariant.price)', 'minPrice')
            .where('priceVariant.deletedAt IS NULL')
            .groupBy('priceVariant.productId');

        const query = this.productRepo
            .createQueryBuilder('product')
            .leftJoinAndSelect('product.category', 'category')
            .leftJoinAndSelect('product.cover', 'cover')
            .leftJoin(
                `(${priceSummary.getQuery()})`,
                'priceSummary',
                '"priceSummary"."productId" = product.id',
            )
            .setParameters(priceSummary.getParameters())
            .where('product.isActive = :isActive', {isActive: true});

        const categoryIds = dto.categoryIds?.length
            ? dto.categoryIds
            : dto.categoryId
                ? [dto.categoryId]
                : [];

        if (categoryIds.length) {
            query.andWhere('product.categoryId IN (:...categoryIds)', {categoryIds});
        }

        if (dto.minPrice !== undefined) {
            query.andWhere('CAST("priceSummary"."minPrice" AS numeric) >= :minPrice', {
                minPrice: dto.minPrice,
            });
        }

        if (dto.maxPrice !== undefined) {
            query.andWhere('CAST("priceSummary"."minPrice" AS numeric) <= :maxPrice', {
                maxPrice: dto.maxPrice,
            });
        }

        if (dto.search?.trim()) {
            query.andWhere('product.name ILIKE :search', {
                search: `%${dto.search.trim()}%`,
            });
        }

        if (dto.sort === 'price_asc') {
            query.orderBy('CAST("priceSummary"."minPrice" AS numeric)', 'ASC', 'NULLS LAST');
        } else if (dto.sort === 'price_desc') {
            query.orderBy('CAST("priceSummary"."minPrice" AS numeric)', 'DESC', 'NULLS LAST');
        } else {
            query.orderBy('product.createdAt', 'DESC');
        }

        query.skip((dto.page - 1) * dto.limit).take(dto.limit);

        const [data, total] = await query.getManyAndCount();
        const result: PaginateResult<Product> = {
            data,
            total,
            page: dto.page,
            limit: dto.limit,
            totalPages: Math.ceil(total / dto.limit),
        };

        result.data = await Promise.all(result.data.map((p) => this.attachCoverUrl(p)));
        await this.attachVariantSummary(result.data);
        return result;
    }

    async findOne(id: string): Promise<Product> {
        const product = await this.productRepo.findOne({
            where: {id},
            relations: ['category', 'cover', 'variants'],
            order: {variants: {createdAt: 'ASC'}},
        });
        if (!product) throw new NotFoundException('Product not found');
        await this.attachCoverUrl(product);
        await this.attachVariantImageUrls(product);
        return product;
    }

    create(dto: CreateProductDto): Promise<Product> {
        return this.productRepo.save(this.productRepo.create(dto));
    }

    async update(id: string, dto: UpdateProductDto): Promise<Product> {
        const product = await this.findOne(id);
        Object.assign(product, dto);
        return this.productRepo.save(product);
    }

    async remove(id: string): Promise<void> {
        await this.findOne(id);
        await this.productRepo.softDelete(id);
    }

    // ── Cover image ───────────────────────────────────────────────────────────

    async setCover(productId: string, file: Express.Multer.File): Promise<Product> {
        const product = await this.productRepo.findOne({
            where: {id: productId},
            relations: ['cover'],
        });
        if (!product) throw new NotFoundException('Product not found');

        if (product.cover) {
            await this.mediaService.delete(product.cover.id);
        }

        const media = await this.mediaService.upload(file, `products/${productId}/cover`);
        product.coverId = media.id;
        return this.productRepo.save(product);
    }

    async removeCover(productId: string): Promise<void> {
        const product = await this.productRepo.findOne({
            where: {id: productId},
            relations: ['cover'],
        });
        if (!product) throw new NotFoundException('Product not found');
        if (!product.cover) return;

        await this.mediaService.delete(product.cover.id);
        product.coverId = null;
        await this.productRepo.save(product);
    }

  // ── Bale notification ────────────────────────────────────────────────────

  async notifyProduct(productId: string): Promise<{ notified: boolean }> {
    const product = await this.productRepo.findOne({
      where: { id: productId },
      relations: ['cover'],
    });
    if (!product) throw new NotFoundException('Product not found');

    const coverUrl = 'https://storage.elizaclothes.com/products/ed05dd6e-23b0-4cc0-a0e9-c0fea10cfd54/583e7e52-367a-4196-9cac-7d2c017fe456.jpg';

    const row = await this.variantRepo
      .createQueryBuilder('v')
      .select('MIN(v.price)', 'minPrice')
      .where('v.productId = :productId', { productId })
      .andWhere('v.deletedAt IS NULL')
      .getRawOne<{ minPrice: string }>();
    const minPrice = row?.minPrice ? Number(row.minPrice) : undefined;

    const success = await this.baleService.notifyNewProduct(product.name, coverUrl, minPrice);

    if (success) {
      await this.productRepo.update(productId, { notified: true });
    }

    return { notified: success };
  }

    // ── Variants ──────────────────────────────────────────────────────────────

    async createVariant(productId: string, dto: CreateVariantDto): Promise<ProductVariant> {
        await this.findOne(productId);

        const normalized = this.normalizeAttributes(dto.attributes);
        if (normalized && Object.keys(normalized).length > 0) {
            await this.attributeService.validateAttributes(normalized);
        }

        await this.assertNoDuplicateVariant(productId, normalized);

        const sku = dto.sku ?? this.generateSku(normalized);
        return this.variantRepo.save(
            this.variantRepo.create({...dto, sku, productId, attributes: normalized}),
        );
    }

    async updateVariant(
        productId: string,
        variantId: string,
        dto: UpdateVariantDto,
    ): Promise<ProductVariant> {
        const variant = await this.variantRepo.findOne({where: {id: variantId, productId}});
        if (!variant) throw new NotFoundException('Variant not found');

        const normalized = this.normalizeAttributes(dto.attributes);
        if (normalized && Object.keys(normalized).length > 0) {
            await this.attributeService.validateAttributes(normalized);
        }
        if (normalized !== undefined) {
            await this.assertNoDuplicateVariant(productId, normalized, variantId);
        }

        const availableBefore = variant.stock - variant.reserved;
        Object.assign(variant, {...dto, attributes: normalized ?? variant.attributes});
        const saved = await this.variantRepo.save(variant);
        const availableAfter = saved.stock - saved.reserved;

        if (availableBefore <= 0 && availableAfter > 0) {
            this.restockService.checkAndNotify(saved.id).catch(() => {});
        }

        return saved;
    }

    async removeVariant(productId: string, variantId: string): Promise<void> {
        const variant = await this.variantRepo.findOne({where: {id: variantId, productId}});
        if (!variant) throw new NotFoundException('Variant not found');
        await this.variantRepo.softDelete(variantId);
    }

    // ── Variant images ────────────────────────────────────────────────────────

    async addVariantImage(
        productId: string,
        variantId: string,
        file: Express.Multer.File,
    ): Promise<{ mediaId: string; url: string }> {
        const variant = await this.variantRepo.findOne({where: {id: variantId, productId}});
        if (!variant) throw new NotFoundException('Variant not found');

        const media = await this.mediaService.upload(
            file,
            `products/${productId}/variants/${variantId}`,
        );

        variant.imageIds = [...(variant.imageIds ?? []), media.id];
        await this.variantRepo.save(variant);

        return {mediaId: media.id, url: await this.mediaService.getUrl(media)};
    }

    async removeVariantImage(
        productId: string,
        variantId: string,
        mediaId: string,
    ): Promise<void> {
        const variant = await this.variantRepo.findOne({where: {id: variantId, productId}});
        if (!variant || !variant.imageIds?.includes(mediaId)) {
            throw new NotFoundException('Image not found');
        }

        await this.mediaService.delete(mediaId);
        variant.imageIds = variant.imageIds.filter((id) => id !== mediaId);
        await this.variantRepo.save(variant);
    }

    async getVariantImages(
        productId: string,
        variantId: string,
    ): Promise<Array<{ mediaId: string; url: string }>> {
        const variant = await this.variantRepo.findOne({where: {id: variantId, productId}});
        if (!variant) throw new NotFoundException('Variant not found');

        return Promise.all(
            (variant.imageIds ?? []).map(async (mediaId) => {
                const media = await this.mediaService.findById(mediaId);
                return {mediaId, url: media ? await this.mediaService.getUrl(media) : ''};
            }),
        );
    }

    // ── Private helpers ───────────────────────────────────────────────────────

    private async attachVariantSummary(products: Product[]): Promise<void> {
        if (!products.length) return;

        const rows = await this.variantRepo
            .createQueryBuilder('v')
            .select('v.productId', 'productId')
            .addSelect('MIN(v.price)', 'minPrice')
            .addSelect(`array_agg(DISTINCT v.attributes->>'رنگ') FILTER (WHERE v.attributes->>'رنگ' IS NOT NULL)`, 'colors')
            .where('v.productId IN (:...ids)', {ids: products.map((p) => p.id)})
            .andWhere('v.deletedAt IS NULL')
            .groupBy('v.productId')
            .getRawMany<{ productId: string; minPrice: string; colors: string[] | null }>();

        const summaryMap = new Map(rows.map((r) => [r.productId, r]));

        for (const product of products) {
            const row = summaryMap.get(product.id);
            (product as any).minPrice = row ? Number(row.minPrice) : null;
            (product as any).colors = row?.colors ?? [];
        }
    }

    private async attachCoverUrl(product: Product): Promise<Product> {
        if (product.cover) {
            (product as any).coverUrl = await this.mediaService.getUrl(product.cover);
        }
        return product;
    }

    private async attachVariantImageUrls(product: Product): Promise<void> {
        if (!product.variants?.length) return;

        const allMediaIds = [...new Set(product.variants.flatMap((v) => v.imageIds ?? []))];
        if (!allMediaIds.length) return;

        const mediaList = await this.mediaService.findManyByIds(allMediaIds);
        const urlMap = new Map(
            await Promise.all(mediaList.map(async (m) => [m.id, await this.mediaService.getUrl(m)] as [string, string])),
        );

        for (const variant of product.variants) {
            (variant as any).imageUrls = (variant.imageIds ?? []).map((id) => urlMap.get(id)).filter(Boolean);
        }
    }

    private generateSku(attributes?: Record<string, string>): string {
        const attrPart =
            attributes && Object.keys(attributes).length > 0
                ? Object.values(attributes)
                    .map((v) => v.replace(/\s+/g, '').toUpperCase().slice(0, 3))
                    .join('')
                    .slice(0, 6)
                    .padEnd(6, 'X')
                : 'NOATTR';

        const randomPart = randomBytes(3).toString('hex').toUpperCase();
        return `${attrPart}-${randomPart}`;
    }

    private normalizeAttributes(
        attrs: Record<string, string> | undefined,
    ): Record<string, string> | undefined {
        if (!attrs) return undefined;
        return Object.fromEntries(
            Object.entries(attrs).sort(([a], [b]) => a.localeCompare(b)),
        );
    }

    private async assertNoDuplicateVariant(
        productId: string,
        attributes: Record<string, string> | undefined,
        excludeVariantId?: string,
    ): Promise<void> {
        const qb = this.variantRepo
            .createQueryBuilder('v')
            .where('v.productId = :productId', {productId})
            .andWhere('v.deletedAt IS NULL');

        if (attributes && Object.keys(attributes).length > 0) {
            qb.andWhere('v.attributes = :attributes::jsonb', {
                attributes: JSON.stringify(attributes),
            });
        } else {
            qb.andWhere('(v.attributes IS NULL OR v.attributes = :empty::jsonb)', {empty: '{}'});
        }

        if (excludeVariantId) {
            qb.andWhere('v.id != :excludeVariantId', {excludeVariantId});
        }

        const duplicate = await qb.getOne();
        if (duplicate) {
            throw new ConflictException(
                'A variant with the same attribute combination already exists for this product',
            );
        }
    }
}
