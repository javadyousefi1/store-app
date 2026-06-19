import {
  Entity, PrimaryGeneratedColumn, Column,
  ManyToOne, JoinColumn, CreateDateColumn, DeleteDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Attribute } from './attribute.entity';

@Entity('attribute_values')
export class AttributeValue {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  attributeId: string;

  @ManyToOne(() => Attribute, (a) => a.values, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'attributeId' })
  attribute: Attribute;

  @ApiProperty({ example: 'red' })
  @Column({ length: 200 })
  value: string;

  @ApiProperty({ example: 'قرمز', required: false })
  @Column({ length: 200, nullable: true })
  label: string | null;

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
