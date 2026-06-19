import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, Index, Unique,
} from 'typeorm';

@Entity('restock_notifications')
@Unique(['variantId', 'userId'])
export class RestockNotification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column()
  variantId: string;

  @Column()
  userId: string;

  @Column({ type: 'timestamptz', nullable: true })
  notifiedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
