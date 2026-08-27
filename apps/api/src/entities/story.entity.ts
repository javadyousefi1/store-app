import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Media } from './media.entity';

@Entity('stories')
export class Story {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'کالکشن جدید' })
  @Column({ length: 120 })
  title: string;

  @ApiProperty({ nullable: true, example: '/products?categoryId=abc' })
  @Column({ type: 'varchar', length: 500, nullable: true })
  linkUrl: string | null;

  @Column({ type: 'uuid', nullable: true })
  imageId: string | null;

  @ManyToOne(() => Media, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'imageId' })
  image: Media | null;

  @ApiProperty({ default: true })
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @ApiProperty({ default: 0 })
  @Column({ type: 'int', default: 0 })
  sortOrder: number;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty()
  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
