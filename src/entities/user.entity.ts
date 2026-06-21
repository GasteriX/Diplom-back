import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { UserRole } from './enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn({ type: 'integer' })
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'display_name', type: 'varchar', length: 120 })
  displayName!: string;

  @Column({ type: 'varchar', default: UserRole.USER })
  role!: UserRole;

  @Column({ name: 'is_email_verified', type: 'boolean', default: false })
  isEmailVerified!: boolean;

  @Column({
    name: 'email_verification_token',
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  emailVerificationToken!: string | null;

  @Column({
    name: 'email_verification_expires',
    type: 'datetime',
    nullable: true,
  })
  emailVerificationExpires!: Date | null;

  @OneToMany(() => Order, (order) => order.buyer)
  orders!: Order[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;
}
