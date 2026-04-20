import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Artist } from './entities/artist.entity';
import { Genre } from './entities/genre.entity';
import { Label } from './entities/label.entity';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';
import { Product } from './entities/product.entity';
import { Track } from './entities/track.entity';
import { User } from './entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 3306),
      username: process.env.DB_USER ?? 'root',
      password: process.env.DB_PASS ?? 'root',
      database: process.env.DB_NAME ?? 'audio_marketplace',
      entities: [User, Artist, Label, Genre, Product, Track, Order, OrderItem],
      synchronize: (process.env.DB_SYNC ?? 'false').toLowerCase() === 'true',
    }),
    ProductsModule,
    AuthModule,
  ],
})
export class AppModule {}
