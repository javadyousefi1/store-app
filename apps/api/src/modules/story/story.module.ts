import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Story } from '../../entities/story.entity';
import { StoryController } from './story.controller';
import { StoryService } from './story.service';
import { MediaModule } from '../media/media.module';

@Module({
  imports: [TypeOrmModule.forFeature([Story]), MediaModule],
  controllers: [StoryController],
  providers: [StoryService],
})
export class StoryModule {}
