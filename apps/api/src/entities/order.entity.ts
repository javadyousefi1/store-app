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
  IRAN_POST = 'iran_post',
}

/** Where the Cod24 shipment currently sits. Null until we first quote/create. */
export enum ShipmentStatus {
  PENDING = 'pending',       // order placed, shipment not yet requested from Cod24
  CREATED = 'created',       // Cod24 has a serial for us
  READY   = 'ready',         // marked ready-to-send
  BARCODED = 'barcoded',     // official post barcode issued
  FAILED  = 'failed',        // Cod24 rejected our create call
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

  @ApiProperty({
    example: '10428631',
    description:
      'Short public order number. Unique. This is the value we ship in SMS templates and show on the shopper-facing UI — separate from the internal UUID and from the gateway refId.',
  })
  @Column({ length: 20, unique: true })
  orderNumber: string;

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
  @Column({
    type: 'enum',
    enum: DeliveryType,
    enumName: 'order_delivery_type_enum',
    default: DeliveryType.IN_PERSON,
  })
  deliveryType: DeliveryType;

  // ── Shipping (populated when deliveryType = IRAN_POST) ──────────────────
  @ApiProperty({ nullable: true, example: '09121234567' })
  @Column({ type: 'varchar', length: 15, nullable: true })
  mobile: string | null;

  @ApiProperty({ nullable: true, example: '0012345678' })
  @Column({ type: 'varchar', length: 10, nullable: true })
  nationalCode: string | null;

  @ApiProperty({ nullable: true, description: 'Cod24 state postCode' })
  @Column({ type: 'int', nullable: true })
  stateCode: number | null;

  @ApiProperty({ nullable: true, description: 'Cod24 city code' })
  @Column({ type: 'int', nullable: true })
  cityCode: number | null;

  @ApiProperty({ nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  stateName: string | null;

  @ApiProperty({ nullable: true })
  @Column({ type: 'varchar', length: 100, nullable: true })
  cityName: string | null;

  @ApiProperty({ description: 'Shipping cost in Toman. 0 for in-person.' })
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  shippingCost: number;

  @ApiProperty({ nullable: true, description: 'Cod24 order serial after createOrder' })
  @Column({ type: 'bigint', nullable: true })
  shipmentSerial: string | null;

  @ApiProperty({ nullable: true, description: 'Post office barcode after getBarcodes' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  shipmentPostBarcode: string | null;

  @ApiProperty({ nullable: true, enum: ShipmentStatus })
  @Column({
    type: 'enum',
    enum: ShipmentStatus,
    enumName: 'order_shipment_status_enum',
    nullable: true,
  })
  shipmentStatus: ShipmentStatus | null;

  @ApiProperty({ description: 'Sum of (price × qty) before discount, in Toman.' })
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  subtotalAmount: number;

  @ApiProperty({ description: 'Coupon discount amount applied, in Toman.' })
  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  discountAmount: number;

  @ApiProperty({ description: 'Final amount payable, in Toman. = subtotalAmount - discountAmount.' })
  @Column({ type: 'decimal', precision: 15, scale: 2 })
  totalAmount: number;

  @ApiProperty({ nullable: true, description: 'Coupon used at order time. No FK — coupon row stays for audit.' })
  @Column({ type: 'uuid', nullable: true })
  couponId: string | null;

  @ApiProperty({ nullable: true, description: 'Full immutable snapshot of the coupon at order time.' })
  @Column({ type: 'jsonb', nullable: true })
  couponSnapshot: {
    id: string;
    code: string;
    percentage: number;
    maxDiscountAmount: number;
    scope: { type: 'product' | 'category'; id: string };
    eligibleItemIds: string[];
    computedDiscountAmount: number;
  } | null;

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
