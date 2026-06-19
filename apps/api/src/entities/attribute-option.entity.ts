import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, DeleteDateColumn, Index } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

@Entity('attribute_options')
@Index(['attribute', 'value'], { unique: true })
export class AttributeOption {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'color' })
  @Column({ length: 100 })
  attribute: string;

  @ApiProperty({ example: 'red' })
  @Column({ length: 200 })
  value: string;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
