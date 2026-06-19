import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, OneToMany, OneToOne,
  JoinColumn, CreateDateColumn, UpdateDateColumn, DeleteDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';
import { OrderItem } from './order-item.entity';
import { Payment } from './payment.entity';

export enum OrderStatus {
  PENDING_PAYMENT  = 'pending_payment',
  PAYMENT_UPLOADED = 'payment_uploaded',
  CONFIRMED        = 'confirmed',
  CANCELLED        = 'cancelled',
}

export enum DeliveryType {
  IN_PERSON = 'in_person',
}

@Entity('orders')
export class Order {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ enum: OrderStatus })
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING_PAYMENT })
  status: OrderStatus;

  @ApiProperty()
  @Column({ length: 100 })
  firstName: string;

  @ApiProperty()
  @Column({ length: 100 })
  lastName: string;

  @ApiProperty()
  @Column({ type: 'text' })
  address: string;

  @ApiProperty({ example: '1234567890' })
  @Column({ length: 10 })
  postalCode: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'text', nullable: true })
  note: string;

  @ApiProperty({ enum: DeliveryType })
  @Column({ type: 'enum', enum: DeliveryType, default: DeliveryType.IN_PERSON })
  deliveryType: DeliveryType;

  @ApiProperty()
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalAmount: number;

  @OneToMany(() => OrderItem, (i) => i.order)
  items: OrderItem[];

  @OneToOne(() => Payment, (p) => p.order)
  payment: Payment;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
