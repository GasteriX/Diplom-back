import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { HutkoCallbackPayload } from 'hutko-node-js-sdk';
import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

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

  @ApiOperation({
    summary: 'Hutko server callback (webhook)',
    description: 'Called by Hutko after payment processing. Do not call manually.',
  })
  @ApiOkResponse({ description: 'Callback accepted' })
  @Post('callback')
  handleCallback(@Body() payload: HutkoCallbackPayload) {
    return this.paymentsService.handleCallback(payload);
  }
}
