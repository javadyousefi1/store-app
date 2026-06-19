import {
  Entity, PrimaryGeneratedColumn, Column,
  OneToMany, CreateDateColumn, DeleteDateColumn,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { AttributeValue } from './attribute-value.entity';

@Entity('attributes')
export class Attribute {
  @ApiProperty()
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'color' })
  @Column({ length: 100 })
  name: string;

  @OneToMany(() => AttributeValue, (v) => v.attribute)
  values: AttributeValue[];

  @ApiProperty()
  @CreateDateColumn()
  createdAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
