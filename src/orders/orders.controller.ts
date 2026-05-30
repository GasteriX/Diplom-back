import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: 'Create order from cart items' })
  @ApiCreatedResponse({ description: 'Created pending order' })
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(user.sub, dto);
  }

  @ApiOperation({ summary: 'List current user orders' })
  @ApiOkResponse({ description: 'User orders' })
  @Get('me')
  findMine(@CurrentUser() user: AuthUser) {
    return this.ordersService.findMine(user.sub);
  }

  @ApiOperation({ summary: 'Get order by id' })
  @ApiParam({ name: 'id', type: String })
  @ApiOkResponse({ description: 'Order details' })
  @Get(':id')
  findOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.ordersService.findOne(id, user.sub);
  }
}
