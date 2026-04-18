import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Artist } from './artist.entity';
import { Genre } from './genre.entity';
import { Label } from './label.entity';
import { OrderItem } from './order-item.entity';
import { Track } from './track.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number;

  @Column()
  title!: string;

  @Column({ type: 'enum', enum: ['Vinyl', 'CD', 'Cassette'] })
  media_type!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column()
  stock!: number;

  @ManyToOne(() => Artist, (artist) => artist.products)
  artist!: Artist;

  @ManyToOne(() => Genre, (genre) => genre.products)
  genre!: Genre;

  @ManyToOne(() => Label, (label) => label.products, { nullable: true })
  @JoinColumn({ name: 'label_id' })
  label!: Label | null;

  @OneToMany(() => Track, (track) => track.product, {
    cascade: true,
    orphanedRowAction: 'delete',
  })
  tracks!: Track[];

  @OneToMany(() => OrderItem, (item) => item.product)
  orderItems!: OrderItem[];
}
