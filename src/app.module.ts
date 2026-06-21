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
import { OrdersModule } from './orders/orders.module';
import { PaymentsModule } from './payments/payments.module';
import { ProductsModule } from './products/products.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: process.env.DB_PATH ?? 'data/app.sqlite',
      entities: [User, Artist, Label, Genre, Product, Track, Order, OrderItem],
      synchronize: (process.env.DB_SYNC ?? 'false').toLowerCase() === 'true',
    }),
    ProductsModule,
    AuthModule,
    OrdersModule,
    PaymentsModule,
  ],
})
export class AppModule {}
