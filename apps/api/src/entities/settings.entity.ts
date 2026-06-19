import { Entity, PrimaryColumn, Column, UpdateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export interface BankCard {
  bankName: string;
  accountHolder: string;
  cardNumber: string;
}

@Entity('settings')
export class Settings {
  @PrimaryColumn({ type: 'int', default: 1 })
  id: number;

  @ApiProperty({ nullable: true })
  @Column({ type: 'text', nullable: true })
  tokenBaleBot: string;

  @ApiProperty({ nullable: true, example: { bankName: 'بانک ملت', accountHolder: 'علی احمدی', cardNumber: '6104337812345678' } })
  @Column({ type: 'jsonb', nullable: true })
  bankCard: BankCard | null;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;
}
