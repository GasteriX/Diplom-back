declare module 'hutko-node-js-sdk' {
  export interface HutkoCheckoutRequest {
    order_id?: string;
    order_desc: string;
    currency: string;
    amount: string | number;
    server_callback_url?: string;
    required_rectoken?: string;
    sender_email?: string;
  }

  export interface HutkoCheckoutTokenResponse {
    response_status: string;
    token?: string;
    error_code?: number;
    error_message?: string;
  }

  export interface HutkoCallbackPayload {
    signature?: string;
    response_signature_string?: string;
    response_status?: string;
    order_status?: string;
    order_id?: string;
    payment_id?: number | string;
    masked_card?: string;
    rectoken?: string;
    amount?: string | number;
    currency?: string;
    sender_email?: string;
    merchant_id?: number | string;
    [key: string]: unknown;
  }

  export default class HutkoInstance {
    constructor(config: {
      merchantId: number;
      secretKey: string;
      baseUrl?: string;
      protocol?: string;
    });

    CheckoutToken(data: HutkoCheckoutRequest): Promise<HutkoCheckoutTokenResponse>;
    Status(data: { order_id: string }): Promise<HutkoCallbackPayload>;
    isValidResponse(data: HutkoCallbackPayload): boolean;
    getOrderId(): string;
  }
}
