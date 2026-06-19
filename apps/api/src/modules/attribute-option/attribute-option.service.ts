import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AttributeOption } from '../../entities/attribute-option.entity';
import { CreateAttributeOptionDto } from './dto/create-attribute-option.dto';

@Injectable()
export class AttributeOptionService {
  constructor(@InjectRepository(AttributeOption) private repo: Repository<AttributeOption>) {}

  findAll(): Promise<AttributeOption[]> {
    return this.repo.find({ order: { attribute: 'ASC', value: 'ASC' } });
  }

  create(dto: CreateAttributeOptionDto): Promise<AttributeOption> {
    return this.repo.save(this.repo.create(dto));
  }

  async remove(id: string): Promise<void> {
    const option = await this.repo.findOne({ where: { id } });
    if (!option) throw new NotFoundException('Attribute option not found');
    await this.repo.softDelete(id);
  }

  async validateAttributes(attributes: Record<string, string>): Promise<void> {
    const entries = Object.entries(attributes);
    const invalids: string[] = [];

    await Promise.all(
      entries.map(async ([attribute, value]) => {
        const exists = await this.repo.findOne({ where: { attribute, value } });
        if (!exists) invalids.push(`${attribute}: ${value}`);
      }),
    );

    if (invalids.length > 0) {
      throw new BadRequestException(
        `Invalid attribute options: ${invalids.join(', ')}`,
      );
    }
  }
}
