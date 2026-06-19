import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attribute } from '../../entities/attribute.entity';
import { AttributeValue } from '../../entities/attribute-value.entity';
import { AttributeController } from './attribute.controller';
import { AttributeService } from './attribute.service';

@Module({
  imports: [TypeOrmModule.forFeature([Attribute, AttributeValue])],
  controllers: [AttributeController],
  providers: [AttributeService],
  exports: [AttributeService],
})
export class AttributeModule {}
