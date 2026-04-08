import { Order, ValidationResult, CustomerBalance, DailyOrderHistory } from './types';
import {
  validateOrderType,
  validateQuantity,
  validateBalance,
  validatePriceFreshness,
  validateDailyLimit,
  calculateSpread,
} from './helpers';

export { Order, ValidationResult, CustomerBalance, DailyOrderHistory } from './types';

/**
 * Validates a gold trading order against business rules.
 */
export function validateOrder(
  order: Order,
  customerBalance?: CustomerBalance,
  currentMarketPrice?: number,
  dailyOrderHistory?: DailyOrderHistory
): ValidationResult {
  const errors: string[] = [];
  let spread: number | undefined;
  let remainingAllowance: number | undefined;

  // Validate order type (must be 'buy' or 'sell')
  const orderTypeError = validateOrderType(order.order_type);
  if (orderTypeError) errors.push(orderTypeError);

  // Validate quantity (must be positive and in multiples of 0.5 baht-weight)
  const quantityError = validateQuantity(order.quantity);
  if (quantityError) errors.push(quantityError);

  // Validate sufficient balance for buy orders
  const price = currentMarketPrice !== undefined ? currentMarketPrice : order.price_freshness;
  const balanceError = validateBalance(order.order_type, order.quantity, price, customerBalance);
  if (balanceError) errors.push(balanceError);

  // Validate price freshness with spread calculation for buy orders
  const priceFreshnessError = validatePriceFreshness(order.price_freshness, order.order_type, currentMarketPrice);
  if (priceFreshnessError) errors.push(priceFreshnessError);

  // Calculate spread for buy orders
  if (order.order_type === 'buy' && currentMarketPrice !== undefined) {
    spread = calculateSpread(currentMarketPrice);
  }

  // Validate daily trading limit
  const dailyLimitResult = validateDailyLimit(order.quantity, dailyOrderHistory);
  if (dailyLimitResult.error) {
    errors.push(dailyLimitResult.error);
  }
  remainingAllowance = dailyLimitResult.remainingAllowance;

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
    spread,
    remainingAllowance,
  };
}
