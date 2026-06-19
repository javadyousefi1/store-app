import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

@Entity('users')
export class User {
  @ApiProperty({ example: 'd290f1ee-6c54-4b01-90e6-d701748f0851', description: 'UUID v4' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'Ali', description: 'First name', nullable: true })
  @Column({ nullable: true, length: 50 })
  firstName: string;

  @ApiProperty({ example: 'Mohammadi', description: 'Last name', nullable: true })
  @Column({ nullable: true, length: 50 })
  lastName: string;

  @ApiProperty({ example: '09128989900', description: 'Iranian mobile number (unique)' })
  @Index({ unique: true })
  @Column({ length: 11 })
  phone: string;

  @ApiProperty({ enum: UserRole, default: UserRole.USER, description: 'User role' })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @ApiProperty({ description: 'Account creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
