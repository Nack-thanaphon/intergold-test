export const VALID_ORDER_TYPES = ['buy', 'sell'] as const;
export const QUANTITY_INCREMENT = 0.5;
export const PRICE_TOLERANCE_PERCENT = 0.02;
export const SPREAD_MARGIN = 0.005;
export const DAILY_TRADING_LIMIT = 5;

export const ERROR_MESSAGES = {
  INVALID_ORDER_TYPE: 'Order type must be either "buy" or "sell"',
  INVALID_QUANTITY_POSITIVE: 'Quantity must be a positive number (multiples of 0.5 baht-weight)',
  INVALID_QUANTITY_INCREMENT: 'Quantity must be in multiples of 0.5 baht-weight (e.g., 1.0, 1.5, 2.5)',
  INSUFFICIENT_BALANCE: `Insufficient balance: customer's available balance must be sufficient to cover quantity × price`,
  STALE_PRICE: `Price freshness: the quoted price must be within 2% of the current market price (to prevent stale quotes)`,
  INVALID_BUY_PRICE_SPREAD: `Buy price must be within 2% of expected price (market price + 0.5% spread)`,
  DAILY_LIMIT_EXCEEDED: `Daily trading limit exceeded. Maximum 5 baht-weight per day`,
} as const;
