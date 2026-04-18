import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';
import { Product } from './product.entity';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => Order, (order) => order.items, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @ManyToOne(() => Product, (product) => product.orderItems, { nullable: false })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ name: 'unit_price', type: 'decimal', precision: 10, scale: 2 })
  unitPrice!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ name: 'total_price', type: 'decimal', precision: 10, scale: 2 })
  totalPrice!: string;
}
