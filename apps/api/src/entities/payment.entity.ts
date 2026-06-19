import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Order } from './order.entity';

export enum PaymentMethod {
  CARD_TO_CARD = 'card_to_card',
}

export enum PaymentStatus {
  PENDING   = 'pending',
  UPLOADED  = 'uploaded',
  CONFIRMED = 'confirmed',
  REJECTED  = 'rejected',
}

@Entity('payments')
export class Payment {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  orderId: string;

  @OneToOne(() => Order, (o) => o.payment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Order;

  @ApiProperty({ enum: PaymentMethod })
  @Column({ type: 'enum', enum: PaymentMethod, default: PaymentMethod.CARD_TO_CARD })
  method: PaymentMethod;

  @ApiProperty({ enum: PaymentStatus })
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ nullable: true })
  receiptKey: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'text', nullable: true })
  adminNote: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
