import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../../entities/product.entity';
import { ProductVariant } from '../../entities/product-variant.entity';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { AttributeModule } from '../attribute/attribute.module';
import { MediaModule } from '../media/media.module';
import { BaleModule } from '../bale/bale.module';
import { RestockNotificationModule } from '../restock-notification/restock-notification.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, ProductVariant]),
    AttributeModule,
    MediaModule,
    BaleModule,
    RestockNotificationModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
})
export class ProductModule {}
