export interface Order {
  customer_id: string | number;
  order_type: string;
  quantity: number;
  quoted_price: number;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  spread?: number;
  remainQuota?: number;
}

export interface CustomerBalance {
  balance: number;
}

export interface DailyOrderHistory {
  customer_id: string | number;
  orders: Array<{
    quantity: number;
    timestamp: Date;
  }>;
}

export enum ORDER_TYPE {
  BUY = 'buy',
  SELL = 'sell',
}

