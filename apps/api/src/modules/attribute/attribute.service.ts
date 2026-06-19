import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attribute } from '../../entities/attribute.entity';
import { AttributeValue } from '../../entities/attribute-value.entity';
import { CreateAttributeDto } from './dto/create-attribute.dto';
import { CreateAttributeValueDto } from './dto/create-attribute-value.dto';

@Injectable()
export class AttributeService {
  constructor(
    @InjectRepository(Attribute) private attributeRepo: Repository<Attribute>,
    @InjectRepository(AttributeValue) private valueRepo: Repository<AttributeValue>,
  ) {}

  findAll(): Promise<Attribute[]> {
    return this.attributeRepo.find({ order: { name: 'ASC' }, relations: ['values'] });
  }

  async create(dto: CreateAttributeDto): Promise<Attribute> {
    const existing = await this.attributeRepo.findOne({ where: { name: dto.name }, withDeleted: true });
    if (existing) {
      if (!existing.deletedAt) throw new ConflictException(`Attribute "${dto.name}" already exists`);
      await this.attributeRepo.restore(existing.id);
      // values stay soft-deleted — caller adds them fresh
      return this.attributeRepo.findOne({ where: { id: existing.id }, relations: ['values'] });
    }
    return this.attributeRepo.save(this.attributeRepo.create(dto));
  }

  async remove(id: string): Promise<void> {
    const attr = await this.attributeRepo.findOne({ where: { id } });
    if (!attr) throw new NotFoundException('Attribute not found');
    await this.valueRepo.softDelete({ attributeId: id });
    await this.attributeRepo.softDelete(id);
  }

  async addValue(attributeId: string, dto: CreateAttributeValueDto): Promise<AttributeValue> {
    const attr = await this.attributeRepo.findOne({ where: { id: attributeId } });
    if (!attr) throw new NotFoundException('Attribute not found');

    const existing = await this.valueRepo.findOne({ where: { attributeId, value: dto.value }, withDeleted: true });
    if (existing) {
      if (!existing.deletedAt) throw new ConflictException(`Value "${dto.value}" already exists for this attribute`);
      await this.valueRepo.restore(existing.id);
      await this.valueRepo.update(existing.id, { label: dto.label ?? null });
      return this.valueRepo.findOne({ where: { id: existing.id } });
    }

    return this.valueRepo.save(this.valueRepo.create({ attributeId, value: dto.value, label: dto.label ?? null }));
  }

  async removeValue(attributeId: string, valueId: string): Promise<void> {
    const value = await this.valueRepo.findOne({ where: { id: valueId, attributeId } });
    if (!value) throw new NotFoundException('Value not found');
    await this.valueRepo.softDelete(valueId);
  }

  async validateAttributes(attributes: Record<string, string>): Promise<void> {
    const invalids: string[] = [];

    await Promise.all(
      Object.entries(attributes).map(async ([name, value]) => {
        const attr = await this.attributeRepo.findOne({ where: { name } });
        if (!attr) { invalids.push(`unknown attribute "${name}"`); return; }

        const val = await this.valueRepo.findOne({ where: { attributeId: attr.id, value } });
        if (!val) invalids.push(`"${name}: ${value}"`);
      }),
    );

    if (invalids.length > 0) {
      throw new BadRequestException(`Invalid attribute options: ${invalids.join(', ')}`);
    }
  }
}
