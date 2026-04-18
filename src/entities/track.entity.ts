import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('tracks')
export class Track {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @ManyToOne(() => Product, (product) => product.tracks, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'int' })
  number!: number;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'time', nullable: true })
  duration!: string | null;
}
