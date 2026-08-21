import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { User } from './user.entity';

@Entity('favorites')
@Index('UQ_favorites_user_product', ['userId', 'productId'], { unique: true })
export class Favorite {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty()
  @Column({ type: 'uuid' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ description: 'Product UUID. No FK — product may have been deleted.' })
  @Index()
  @Column({ type: 'uuid' })
  productId: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
