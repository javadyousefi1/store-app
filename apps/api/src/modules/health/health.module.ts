import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { CacheModule } from '../../services/cache/cache.module';
import { StorageModule } from '../../services/storage/storage.module';

@Module({
  imports: [TypeOrmModule.forFeature([]), CacheModule, StorageModule],
  controllers: [HealthController],
})
export class HealthModule {}
