import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import configuration from './config/configuration';
import { User } from './entities/user.entity';
import { Category } from './entities/category.entity';
import { Product } from './entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { Attribute } from './entities/attribute.entity';
import { AttributeValue } from './entities/attribute-value.entity';
import { Media } from './entities/media.entity';
import { Cart } from './entities/cart.entity';
import { CartItem } from './entities/cart-item.entity';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Payment } from './entities/payment.entity';
import { Settings } from './entities/settings.entity';
import { RestockNotification } from './entities/restock-notification.entity';
import { Favorite } from './entities/favorite.entity';
import { Coupon } from './entities/coupon.entity';
import { CouponRedemption } from './entities/coupon-redemption.entity';
import { Article } from './entities/article.entity';
import { ArticleCategory } from './entities/article-category.entity';
import { Slider } from './entities/slider.entity';
import { Story } from './entities/story.entity';
import { CacheModule } from './services/cache/cache.module';
import { StorageModule } from './services/storage/storage.module';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { CategoryModule } from './modules/category/category.module';
import { ProductModule } from './modules/product/product.module';
import { AttributeModule } from './modules/attribute/attribute.module';
import { MediaModule } from './modules/media/media.module';
import { CartModule } from './modules/cart/cart.module';
import { OrderModule } from './modules/order/order.module';
import { PaymentGatewayModule } from './modules/payment-gateway/payment-gateway.module';
import { PaymentModule } from './modules/payment/payment.module';
import { SettingsModule } from './modules/settings/settings.module';
import { BaleModule } from './modules/bale/bale.module';
import { HealthModule } from './modules/health/health.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { RestockNotificationModule } from './modules/restock-notification/restock-notification.module';
import { FavoriteModule } from './modules/favorite/favorite.module';
import { CouponModule } from './modules/coupon/coupon.module';
import { ArticleModule } from './modules/article/article.module';
import { SliderModule } from './modules/slider/slider.module';
import { StoryModule } from './modules/story/story.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { SeedService } from './database/seed.service';

const entities = [User, Category, Product, ProductVariant, Attribute, AttributeValue, Media, Cart, CartItem, Order, OrderItem, Payment, Settings, RestockNotification, Favorite, Coupon, CouponRedemption, Article, ArticleCategory, Slider, Story];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('database.host');
        const port = configService.get<number>('database.port');
        const username = configService.get<string>('database.username');
        const password = configService.get<string>('database.password');
        const database = configService.get<string>('database.name');

        console.log('========== [DB CONFIG DEBUG] ==========');
        console.log('host:', JSON.stringify(host), 'len:', host?.length);
        console.log('port:', JSON.stringify(port), 'type:', typeof port);
        console.log('username:', JSON.stringify(username), 'len:', username?.length);
        console.log('password:', JSON.stringify(password), 'len:', password?.length);
        console.log('database:', JSON.stringify(database), 'len:', database?.length);
        console.log('raw process.env.DB_PASS:', JSON.stringify(process.env.DB_PASS), 'len:', process.env.DB_PASS?.length);
        console.log('========================================');

        return {
          type: 'postgres' as const,
          host,
          port,
          username,
          password,
          database,
          entities,
          migrations: [__dirname + '/database/migrations/*.{ts,js}'],
          migrationsTableName: 'migrations',
          synchronize: false,
          logging: false,
        };
      },
    }),

    CacheModule,
    StorageModule,
    AuthModule,
    UserModule,
    CategoryModule,
    ProductModule,
    AttributeModule,
    MediaModule,
    CartModule,
    OrderModule,
    PaymentGatewayModule,
    PaymentModule,
    SettingsModule,
    BaleModule,
    HealthModule,
    DashboardModule,
    RestockNotificationModule,
    FavoriteModule,
    CouponModule,
    ArticleModule,
    SliderModule,
    StoryModule,
    ShippingModule,
    TypeOrmModule.forFeature([User]),
  ],
  providers: [SeedService],
})
export class AppModule {}
