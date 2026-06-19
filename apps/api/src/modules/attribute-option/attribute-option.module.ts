import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttributeOption } from '../../entities/attribute-option.entity';
import { AttributeOptionController } from './attribute-option.controller';
import { AttributeOptionService } from './attribute-option.service';

@Module({
  imports: [TypeOrmModule.forFeature([AttributeOption])],
  controllers: [AttributeOptionController],
  providers: [AttributeOptionService],
  exports: [AttributeOptionService],
})
export class AttributeOptionModule {}
