export interface Order {
  customer_id: string | number;
  order_type: string;
  quantity: number;
  price_freshness: number;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  spread?: number;
  remainingAllowance?: number;
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
