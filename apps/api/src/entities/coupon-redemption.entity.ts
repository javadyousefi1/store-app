import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('coupon_redemptions')
@Index('UQ_coupon_redemptions_coupon_user', ['couponId', 'userId'], { unique: true })
export class CouponRedemption {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  couponId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  userId: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  orderId: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
