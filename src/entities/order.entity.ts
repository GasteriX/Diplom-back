import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderStatus } from './enums';
import { OrderItem } from './order-item.entity';
import { User } from './user.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => User, (user) => user.orders, { nullable: false })
  @JoinColumn({ name: 'buyer_id' })
  buyer!: User;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status!: OrderStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  subtotal!: string;

  @Column({ name: 'shipping_cost', type: 'decimal', precision: 10, scale: 2, default: 0 })
  shippingCost!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  total!: string;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items!: OrderItem[];

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt!: Date;
}
