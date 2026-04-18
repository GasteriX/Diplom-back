import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import { Artist } from '../entities/artist.entity';
import { Genre } from '../entities/genre.entity';
import { Label } from '../entities/label.entity';
import { Track } from '../entities/track.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Artist, Genre, Label, Track])],
  providers: [ProductsService],
  controllers: [ProductsController],
})
export class ProductsModule {}

