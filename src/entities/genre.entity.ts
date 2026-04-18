import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('genres')
export class Genre {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 120, unique: true })
  name!: string;

  @OneToMany(() => Product, (product) => product.genre)
  products!: Product[];
}
