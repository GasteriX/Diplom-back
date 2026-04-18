import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Product } from './product.entity';

@Entity('labels')
export class Label {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id!: string;

  @Column({ type: 'varchar', length: 180, unique: true })
  name!: string;

  @OneToMany(() => Product, (product) => product.label)
  products!: Product[];

}
