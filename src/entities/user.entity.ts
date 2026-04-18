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
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ name: 'password_hash', type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ name: 'display_name', type: 'varchar', length: 120 })
  displayName!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.BUYER,
  })
  role!: UserRole;

  @OneToMany(() => Order, (order) => order.buyer)
  orders!: Order[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;
}
