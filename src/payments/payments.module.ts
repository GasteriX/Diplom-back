import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { Product } from '../entities/product.entity';
import { User } from '../entities/user.entity';
import { HutkoService } from './hutko.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Product])],
  controllers: [PaymentsController],
  providers: [HutkoService, PaymentsService],
  exports: [HutkoService, PaymentsService],
})
export class PaymentsModule {}
