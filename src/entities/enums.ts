export enum UserRole {
  BUYER = 'buyer',
  SELLER = 'seller',
  ADMIN = 'admin',
}

export enum MediaFormat {
  CASSETTE = 'cassette',
  VINYL = 'vinyl',
  CD = 'cd',
}

export enum ProductCondition {
  SEALED = 'sealed',
  MINT = 'mint',
  NEAR_MINT = 'near_mint',
  VERY_GOOD_PLUS = 'very_good_plus',
  VERY_GOOD = 'very_good',
  GOOD = 'good',
}

export enum OrderStatus {
  PENDING = 'pending',
  PAID = 'paid',
  SHIPPED = 'shipped',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}
