import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { HutkoService } from './hutko.service';
import { normalizeHutkoCallback } from './hutko-callback.util';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly hutkoService: HutkoService,
  ) {}

  @ApiOperation({
    summary: 'Hutko public config for test / frontend',
    description:
      'Test merchant 1700002 and JS SDK URL. See Hutko step-by-step JS SDK guide.',
  })
  @ApiOkResponse({
    description: 'Merchant id, currency, callback URL',
  })
  @Get('config')
  getConfig() {
    return this.hutkoService.getPublicConfig();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Get Hutko checkout token for JavaScript SDK',
    description:
      'Returns host-to-host token for @hutko/js-sdk. See https://docs.hutko.org/uk/docs/page/step-by-step-instruction-to-accept-payments-with-javascript-sdk/',
  })
  @ApiParam({ name: 'orderId', type: String })
  @ApiOkResponse({
    description: 'Token for frontend card form',
    schema: {
      example: {
        token: 'afcb21aef707b1fea2565b66bac7dc41d7833390',
        orderId: '1',
        externalOrderId: 'ORDER-1',
        amount: 29999,
        currency: 'UAH',
      },
    },
  })
  @Post('checkout-token/:orderId')
  createCheckoutToken(
    @CurrentUser() user: AuthUser,
    @Param('orderId') orderId: string,
  ) {
    return this.paymentsService.createCheckoutToken(orderId, user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Sync payment status from Hutko' })
  @ApiParam({ name: 'orderId', type: String })
  @Get('status/:orderId')
  syncStatus(@CurrentUser() user: AuthUser, @Param('orderId') orderId: string) {
    return this.paymentsService.syncStatus(orderId, user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'Recurring payment with saved rectoken',
    description:
      'Uses rectoken from the buyer last paid order (Hutko /api/recurring). Requires a prior card payment.',
  })
  @ApiParam({ name: 'orderId', type: String })
  @Post('recurring/:orderId')
  chargeRecurring(
    @CurrentUser() user: AuthUser,
    @Param('orderId') orderId: string,
  ) {
    return this.paymentsService.chargeRecurring(orderId, user.sub);
  }

  @ApiOperation({
    summary: 'Hutko server callback (webhook)',
    description:
      'Called by Hutko after payment processing. Returns HTTP 200 as required by Hutko. Supports JSON and form POST.',
  })
  @ApiOkResponse({ description: 'Callback accepted' })
  @HttpCode(HttpStatus.OK)
  @Post('callback')
  handleCallback(@Body() body: Record<string, unknown>) {
    return this.paymentsService.handleCallback(normalizeHutkoCallback(body));
  }
}
