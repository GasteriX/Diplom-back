import { Injectable } from '@nestjs/common';
import HutkoInstance, {
  HutkoCallbackPayload,
  HutkoCheckoutTokenResponse,
} from 'hutko-node-js-sdk';

@Injectable()
export class HutkoService {
  private readonly client: HutkoInstance;
  private readonly currency: string;
  private readonly callbackUrl: string;

  constructor() {
    const merchantId = Number(process.env.HUTKO_MERCHANT_ID ?? 1700002);
    const secretKey = process.env.HUTKO_SECRET_KEY ?? 'test';

    this.client = new HutkoInstance({ merchantId, secretKey });
    this.currency = process.env.HUTKO_CURRENCY ?? 'UAH';
    this.callbackUrl = `${(
      process.env.API_URL ?? 'http://localhost:3000'
    ).replace(/\/$/, '')}/payments/callback`;
  }

  getCurrency(): string {
    return this.currency;
  }

  /** Сумма в гривнах/долларах → минорные единицы для Hutko (копейки) */
  toMinorUnits(amount: number): number {
    return Math.round(amount * 100);
  }

  /** Минорные единицы → decimal string для БД */
  fromMinorUnits(amount: number | string): string {
    return (Number(amount) / 100).toFixed(2);
  }

  buildExternalOrderId(orderId: string): string {
    return `ORDER-${orderId}`;
  }

  async createCheckoutToken(params: {
    externalOrderId: string;
    amountMinor: number;
    orderDesc: string;
    senderEmail?: string;
  }): Promise<HutkoCheckoutTokenResponse> {
    return this.client.CheckoutToken({
      order_id: params.externalOrderId,
      order_desc: params.orderDesc,
      currency: this.currency,
      amount: String(params.amountMinor),
      server_callback_url: this.callbackUrl,
      required_rectoken: 'Y',
      sender_email: params.senderEmail,
    });
  }

  isValidCallback(payload: HutkoCallbackPayload): boolean {
    return this.client.isValidResponse(payload);
  }

  async getPaymentStatus(externalOrderId: string): Promise<HutkoCallbackPayload> {
    return this.client.Status({ order_id: externalOrderId });
  }
}
