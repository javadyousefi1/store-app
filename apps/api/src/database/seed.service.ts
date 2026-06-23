import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';

const ADMIN_PHONES = ['09014399845', '09126868504'];

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  async onApplicationBootstrap() {
    const count = await this.userRepository.count();
    if (count > 0) {
      this.logger.log(`Skipping seed: ${count} users already exist`);
      return;
    }

    for (const phone of ADMIN_PHONES) {
      await this.userRepository.save(
        this.userRepository.create({ phone, role: UserRole.ADMIN }),
      );
      this.logger.log(`Admin seeded: ${phone}`);
    }
  }
}
