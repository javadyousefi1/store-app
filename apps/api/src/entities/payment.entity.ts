import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn, Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Order } from './order.entity';

export enum PaymentMethod {
  CARD_TO_CARD   = 'card_to_card',
  ONLINE_GATEWAY = 'online_gateway',
}

export enum PaymentStatus {
  PENDING   = 'pending',    // freshly created; nothing has happened yet
  INITIATED = 'initiated',  // gateway authority obtained; shopper redirected
  UPLOADED  = 'uploaded',   // card-to-card receipt uploaded; awaits admin
  CONFIRMED = 'confirmed',  // paid & fulfilled
  REJECTED  = 'rejected',   // admin rejected a card-to-card receipt
  FAILED    = 'failed',     // gateway verify returned failure / shopper aborted
}

@Entity('payments')
@Index('UQ_payments_gateway_authority', ['gatewayName', 'authority'], {
  unique: true,
  where: '"authority" IS NOT NULL',
})
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

  // ── Card-to-card ────────────────────────────────────────────────────────
  @Column({ nullable: true })
  receiptKey: string;

  @ApiProperty({ nullable: true })
  @Column({ type: 'text', nullable: true })
  adminNote: string;

  // ── Online gateway (zarinpal + future providers) ────────────────────────
  @ApiProperty({ nullable: true, description: 'Provider slug, e.g. "zarinpal".' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  gatewayName: string | null;

  @ApiProperty({ nullable: true, description: 'Gateway-issued session token used to resume the callback flow.' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  authority: string | null;

  @ApiProperty({ nullable: true, description: 'Reference number shown to the shopper after successful payment.' })
  @Column({ type: 'varchar', length: 100, nullable: true })
  refId: string | null;

  @ApiProperty({ nullable: true, description: 'Masked card PAN returned by the gateway.' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  cardPan: string | null;

  @ApiProperty({ nullable: true })
  @Column({ type: 'varchar', length: 128, nullable: true })
  cardHash: string | null;

  @ApiProperty({ nullable: true, description: 'Gateway fee amount.' })
  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  fee: number | null;

  @ApiProperty({ nullable: true, description: 'Who pays the fee (Merchant / Payer per gateway).' })
  @Column({ type: 'varchar', length: 50, nullable: true })
  feeType: string | null;

  @ApiProperty({ nullable: true, description: 'Last raw response code from the gateway.' })
  @Column({ type: 'int', nullable: true })
  gatewayCode: number | null;

  @ApiProperty({ nullable: true })
  @Column({ type: 'text', nullable: true })
  gatewayMessage: string | null;

  @Column({ type: 'timestamp', nullable: true })
  initiatedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  paidAt: Date | null;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
