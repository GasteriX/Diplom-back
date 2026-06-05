import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { OrderStatus } from '../entities/enums';
import { OrderItem } from '../entities/order-item.entity';
import { Order } from '../entities/order.entity';
import { Product } from '../entities/product.entity';
import { User } from '../entities/user.entity';
import { HutkoService } from '../payments/hutko.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly ordersRepo: Repository<Order>,
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    private readonly dataSource: DataSource,
    private readonly hutkoService: HutkoService,
  ) {}

  private formatOrder(order: Order) {
    return {
      id: order.id,
      status: order.status,
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      total: order.total,
      currency: order.currency,
      externalOrderId: order.externalOrderId,
      paymentId: order.paymentId,
      maskedCard: order.maskedCard,
      paidAt: order.paidAt,
      items: order.items?.map((item) => ({
        id: item.id,
        productId: item.product.id,
        productTitle: item.product.title,
        unitPrice: item.unitPrice,
        quantity: item.quantity,
        totalPrice: item.totalPrice,
      })),
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }

  private async findOwnedOrder(orderId: string, buyerId: string): Promise<Order> {
    const order = await this.ordersRepo.findOne({
      where: { id: orderId, buyer: { id: buyerId } },
      relations: ['items', 'items.product', 'buyer'],
    });
    if (!order) {
      throw new NotFoundException('Order not found');
    }
    return order;
  }

  async create(buyerId: string, dto: CreateOrderDto) {
    const buyer = await this.usersRepo.findOne({ where: { id: buyerId } });
    if (!buyer) {
      throw new NotFoundException('User not found');
    }

    const productIds = dto.items.map((item) => Number(item.productId));
    const products = await this.productsRepo.find({
      where: { id: In(productIds) },
    });
    const productMap = new Map(
      products.map((product) => [Number(product.id), product]),
    );

    let subtotal = 0;
    const lineItems: Array<{
      product: Product;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }> = [];

    for (const item of dto.items) {
      const product = productMap.get(Number(item.productId));
      if (!product) {
        throw new BadRequestException(`Product ${item.productId} not found`);
      }
      if (product.stock < item.quantity) {
        throw new BadRequestException(
          `Insufficient stock for product "${product.title}"`,
        );
      }

      const unitPrice = Number(product.price);
      const totalPrice = unitPrice * item.quantity;
      subtotal += totalPrice;
      lineItems.push({ product, quantity: item.quantity, unitPrice, totalPrice });
    }

    const shippingCost = dto.shippingCost ?? 0;
    const total = subtotal + shippingCost;

    const savedOrder = await this.dataSource.transaction(async (manager) => {
      const order = manager.create(Order, {
        buyer,
        status: OrderStatus.PENDING,
        subtotal: subtotal.toFixed(2),
        shippingCost: shippingCost.toFixed(2),
        total: total.toFixed(2),
        currency: this.hutkoService.getCurrency(),
      });
      const persistedOrder = await manager.save(order);

      persistedOrder.externalOrderId =
        this.hutkoService.buildExternalOrderId(persistedOrder.id);
      await manager.save(persistedOrder);

      for (const line of lineItems) {
        const orderItem = manager.create(OrderItem, {
          order: persistedOrder,
          product: line.product,
          unitPrice: line.unitPrice.toFixed(2),
          quantity: line.quantity,
          totalPrice: line.totalPrice.toFixed(2),
        });
        await manager.save(orderItem);
      }

      return persistedOrder;
    });

    const fullOrder = await this.findOwnedOrder(savedOrder.id, buyerId);
    return this.formatOrder(fullOrder);
  }

  async findMine(buyerId: string) {
    const orders = await this.ordersRepo.find({
      where: { buyer: { id: buyerId } },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
    return orders.map((order) => this.formatOrder(order));
  }

  async findOne(orderId: string, buyerId: string) {
    const order = await this.findOwnedOrder(orderId, buyerId);
    return this.formatOrder(order);
  }
}
