import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Slider } from '../../entities/slider.entity';
import { SliderController } from './slider.controller';
import { SliderService } from './slider.service';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [TypeOrmModule.forFeature([Slider]), MediaModule],
  controllers: [SliderController],
  providers: [SliderService],
})
export class SliderModule {}
