import { Order, ValidationResult, CustomerBalance, DailyOrderHistory, ORDER_TYPE } from './types';
import {
  validateOrderType,
  validateQuantity,
  validateBalance,
  validateQuotedPrice,
  validateDailyLimit,
  calculateSpread,
} from './helpers';

export type { Order, ValidationResult, CustomerBalance, DailyOrderHistory };

/**
 * Validates a gold trading order against business rules.
 * Optimized for high-frequency validation (400k+ req/s).
 */
export function validateOrder(
  order: Order,
  customerBalance?: CustomerBalance,
  currentMarketPrice?: number,
  dailyOrderHistory?: DailyOrderHistory
): ValidationResult {
  if (!order) {
    return {
      valid: false,
      errors: ['Order is required'],
    };
  }

  const { order_type, quantity, quoted_price } = order;
  const price = currentMarketPrice ?? order.quoted_price;
  const errors: string[] = [];

  const orderTypeError = validateOrderType(order_type);
  if (orderTypeError) errors.push(orderTypeError);

  const quantityError = validateQuantity(quantity);
  if (quantityError) errors.push(quantityError);

  const balanceError = validateBalance(order_type, quantity, price, customerBalance);
  if (balanceError) errors.push(balanceError);

  const quotedPriceError = validateQuotedPrice(order_type, quoted_price, currentMarketPrice);
  if (quotedPriceError) errors.push(quotedPriceError);

  const dailyLimitResult = validateDailyLimit(quantity, dailyOrderHistory);
  if (dailyLimitResult.error) errors.push(dailyLimitResult.error);

  const spread = order_type === ORDER_TYPE.BUY && currentMarketPrice !== undefined
    ? calculateSpread(currentMarketPrice)
    : undefined;

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    spread,
    remainQuota: dailyLimitResult.remainQuota,
    maxQuota: dailyLimitResult.maxQuota,
  };
}
