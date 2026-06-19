import { Controller, Get, HttpCode } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CacheService } from '../../services/cache/cache.service';
import { StorageService } from '../../services/storage/storage.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource() private dataSource: DataSource,
    private cacheService: CacheService,
    private storageService: StorageService,
  ) {}

  @Get()
  @HttpCode(200)
  @ApiOperation({ summary: 'Liveness + readiness check' })
  async check() {
    const [db, redis] = await Promise.all([
      this.checkDb(),
      this.cacheService.ping(),
    ]);

    const storage = this.storageService.isReady();

    const allUp = db && redis && storage;

    return {
      status: allUp ? 'ok' : 'degraded',
      checks: {
        database: db ? 'up' : 'down',
        redis: redis ? 'up' : 'down',
        storage: storage ? 'up' : 'down',
      },
    };
  }

  private async checkDb(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}
