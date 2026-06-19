import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Category } from './category.entity';
import { ProductVariant } from './product-variant.entity';
import { Media } from './media.entity';

@Entity('products')
export class Product {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Index()
  @Column()
  categoryId: string;

  @ManyToOne(() => Category, { onDelete: 'SET NULL', nullable: true, eager: false })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  @ApiProperty({ example: 'iPhone 16 Pro' })
  @Column({ length: 200 })
  name: string;

  @ApiProperty({ example: 'Latest Apple flagship', nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  coverId: string;

  @ManyToOne(() => Media, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'coverId' })
  cover: Media;

  @OneToMany(() => ProductVariant, (v) => v.product)
  variants: ProductVariant[];

  @ApiProperty({ default: true })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ default: false })
  @Column({ default: false })
  notified: boolean;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
