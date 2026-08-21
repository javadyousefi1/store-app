import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum CouponScopeType {
  PRODUCT = 'product',
  CATEGORY = 'category',
}

@Entity('coupons')
export class Coupon {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'SUMMER25', description: 'Unique, stored upper-case.' })
  @Index({ unique: true })
  @Column({ length: 64 })
  code: string;

  @ApiProperty({ example: 20, description: 'Discount percentage (1-100).' })
  @Column({ type: 'int' })
  percentage: number;

  @ApiProperty({ example: 100000, description: 'Maximum discount in Toman.' })
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  maxDiscountAmount: number;

  @ApiProperty({ example: 100, description: 'Total number of allowed uses.' })
  @Column({ type: 'int' })
  quantity: number;

  @ApiProperty({ example: 3, description: 'How many uses have been consumed so far.' })
  @Column({ type: 'int', default: 0 })
  usedCount: number;

  @ApiProperty({ default: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ enum: CouponScopeType })
  @Column({ type: 'enum', enum: CouponScopeType })
  scopeType: CouponScopeType;

  @ApiProperty({ description: 'Product or category UUID, depending on scopeType.' })
  @Column({ type: 'uuid' })
  scopeId: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
