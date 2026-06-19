import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Order } from './order.entity';

@Entity('order_items')
export class OrderItem {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @ManyToOne(() => Order, (o) => o.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ApiProperty({ nullable: true, description: 'Nullable — variant may be deleted later' })
  @Column({ nullable: true })
  variantId: string;

  // ── Snapshots (immutable at order time) ───────────────────────────────────

  @ApiProperty()
  @Column({ length: 200 })
  productName: string;

  @ApiProperty()
  @Column({ length: 100 })
  variantSku: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'jsonb', nullable: true })
  variantAttributes: Record<string, string>;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  price: number;

  @ApiProperty()
  @Column({ type: 'int' })
  quantity: number;

  @ApiProperty({ nullable: true, description: 'S3 key of variant first image at order time' })
  @Column({ type: 'text', nullable: true })
  variantImageKey: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
