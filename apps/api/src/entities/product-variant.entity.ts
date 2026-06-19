import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Product } from './product.entity';

@Entity('product_variants')
export class ProductVariant {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Index()
  @Column()
  productId: string;

  @ManyToOne(() => Product, (p) => p.variants, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @ApiProperty({ example: 'IPH-16P-BLK-256' })
  @Index({ unique: true })
  @Column({ length: 100 })
  sku: string;

  @ApiProperty({ example: 59900000 })
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  price: number;

  @ApiProperty({ example: 10 })
  @Column({ type: 'int', default: 0 })
  stock: number;

  @ApiProperty({ example: 0, description: 'Stock reserved pending payment confirmation' })
  @Column({ type: 'int', default: 0 })
  reserved: number;

  @ApiProperty({ example: { color: 'black', storage: '256GB' }, nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  attributes: Record<string, string>;

  @ApiProperty({ example: ['uuid1', 'uuid2'], description: 'Ordered list of media IDs' })
  @Column({ type: 'text', array: true, default: '{}' })
  imageIds: string[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
