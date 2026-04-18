import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('artists')
export class Artist {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 180, unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  bio!: string | null;

  @OneToMany(() => Product, (product) => product.artist)
  products!: Product[];
}
