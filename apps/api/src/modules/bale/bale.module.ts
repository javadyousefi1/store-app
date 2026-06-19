import { Module } from '@nestjs/common';
import { BaleService } from './bale.service';
import { SettingsModule } from '../settings/settings.module';

@Module({
  imports: [SettingsModule],
  providers: [BaleService],
  exports: [BaleService],
})
export class BaleModule {}
