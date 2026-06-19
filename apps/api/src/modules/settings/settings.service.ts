import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from '../../entities/settings.entity';
import { UpdateSettingsDto } from './dto/update-settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectRepository(Settings) private repo: Repository<Settings>,
  ) {}

  async get(): Promise<Settings> {
    let settings = await this.repo.findOne({ where: { id: 1 } });
    if (!settings) {
      settings = await this.repo.save(this.repo.create({ id: 1 }));
    }
    return settings;
  }

  async update(dto: UpdateSettingsDto): Promise<Settings> {
    await this.repo.update(1, dto);
    return this.get();
  }
}
