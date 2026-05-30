import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { OrderStatus } from '../entities/enums';
import { Order } from '../entities/order.entity';
import { Product } from '../entities/product.entity';
import { HutkoCallbackPayload } from 'hutko-node-js-sdk';
import { HutkoService } from './hutko.service';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    private readonly hutkoService: HutkoService,
    private readonly dataSource: DataSource,
  ) {}

  async createCheckoutToken(orderId: string, buyerId: string) {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId, buyer: { id: buyerId } },
      relations: ['buyer', 'items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException('Order is not available for payment');
    }

    if (!order.externalOrderId) {
      order.externalOrderId = this.hutkoService.buildExternalOrderId(order.id);
      await this.ordersRepo.save(order);
    }

    const amountMinor = this.hutkoService.toMinorUnits(Number(order.total));
    const orderDesc =
      order.items
        ?.map((item) => `${item.product.title} x${item.quantity}`)
        .join(', ')
        .slice(0, 1000) || `Order #${order.id}`;

    const hutkoResponse = await this.hutkoService.createCheckoutToken({
      externalOrderId: order.externalOrderId,
      amountMinor,
      orderDesc,
      senderEmail: order.buyer.email,
    });

    if (hutkoResponse.response_status !== 'success' || !hutkoResponse.token) {
      throw new BadRequestException(
        hutkoResponse.error_message ?? 'Failed to create payment token',
      );
    }

    return {
      token: hutkoResponse.token,
      orderId: order.id,
      externalOrderId: order.externalOrderId,
      amount: amountMinor,
      currency: order.currency,
    };
  }

  async handleCallback(payload: HutkoCallbackPayload) {
    if (!this.hutkoService.isValidCallback(payload)) {
      throw new UnauthorizedException('Invalid payment callback signature');
    }

    const externalOrderId = payload.order_id;
    if (!externalOrderId) {
      throw new BadRequestException('Missing order_id in callback');
    }

    const order = await this.ordersRepo.findOne({
      where: { externalOrderId },
      relations: ['items', 'items.product'],
    });

    if (!order) {
      this.logger.warn(`Callback for unknown order: ${externalOrderId}`);
      return { ok: true };
    }

    if (order.status === OrderStatus.PAID) {
      return { ok: true, status: order.status };
    }

    const isApproved =
      payload.response_status === 'success' &&
      payload.order_status === 'approved';

    if (!isApproved) {
      this.logger.log(
        `Payment declined for order ${order.id}: ${payload.order_status ?? payload.response_status}`,
      );
      return { ok: true, status: order.status };
    }

    await this.dataSource.transaction(async (manager) => {
      const lockedOrder = await manager.findOne(Order, {
        where: { id: order.id },
        relations: ['items', 'items.product'],
        lock: { mode: 'pessimistic_write' },
      });

      if (!lockedOrder || lockedOrder.status === OrderStatus.PAID) {
        return;
      }

      for (const item of lockedOrder.items) {
        const product = await manager.findOne(Product, {
          where: { id: item.product.id },
          lock: { mode: 'pessimistic_write' },
        });
        if (!product || product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for product "${product?.title ?? item.product.id}"`,
          );
        }
        product.stock -= item.quantity;
        await manager.save(product);
      }

      lockedOrder.status = OrderStatus.PAID;
      lockedOrder.paymentId = payload.payment_id
        ? String(payload.payment_id)
        : null;
      lockedOrder.maskedCard = payload.masked_card ?? null;
      lockedOrder.rectoken = payload.rectoken || null;
      lockedOrder.paidAt = new Date();
      await manager.save(lockedOrder);
    });

    this.logger.log(`Order ${order.id} marked as paid`);
    return { ok: true, status: OrderStatus.PAID };
  }

  async syncStatus(orderId: string, buyerId: string) {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId, buyer: { id: buyerId } },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order.externalOrderId) {
      throw new BadRequestException('Order has no payment reference');
    }

    const status = await this.hutkoService.getPaymentStatus(
      order.externalOrderId,
    );

    if (
      order.status === OrderStatus.PENDING &&
      status.response_status === 'success' &&
      status.order_status === 'approved'
    ) {
      await this.handleCallback(status);
    }

    const updated = await this.ordersRepo.findOne({ where: { id: order.id } });
    return {
      orderId: updated?.id,
      status: updated?.status,
      paymentId: updated?.paymentId,
      paidAt: updated?.paidAt,
    };
  }
}
