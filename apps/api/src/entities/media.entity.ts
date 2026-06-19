import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('media')
export class Media {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Object key in MinIO bucket' })
  @Column()
  key: string;

  @ApiProperty()
  @Column()
  bucket: string;

  @ApiProperty({ example: 'product-front.jpg' })
  @Column()
  originalName: string;

  @ApiProperty({ example: 'image/jpeg' })
  @Column()
  mimeType: string;

  @ApiProperty({ description: 'File size in bytes' })
  @Column()
  size: number;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;
}
