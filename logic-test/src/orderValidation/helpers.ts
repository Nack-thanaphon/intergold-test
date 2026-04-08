import { CustomerBalance, DailyOrderHistory } from './types';
import { VALID_ORDER_TYPES, PRICE_TOLERANCE_PERCENT, SPREAD_MARGIN, DAILY_TRADING_LIMIT, ERROR_MESSAGES } from './constants';

export function createError(message: string): string | null {
  return message;
}

export function validateOrderType(orderType: string): string | null {
  if (!orderType || !VALID_ORDER_TYPES.includes(orderType as any)) {
    return createError(ERROR_MESSAGES.INVALID_ORDER_TYPE);
  }
  return null;
}

export function validateQuantity(quantity: number): string | null {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return createError(ERROR_MESSAGES.INVALID_QUANTITY_POSITIVE);
  }
  
  if ((quantity * 2) % 1 !== 0) {
    return createError(ERROR_MESSAGES.INVALID_QUANTITY_INCREMENT);
  }
  
  return null;
}

export function validateBalance(
  orderType: string,
  quantity: number,
  price: number,
  customerBalance?: CustomerBalance
): string | null {
  if (orderType !== 'buy' || !customerBalance) {
    return null;
  }

  const totalCost = quantity * price;
  if (customerBalance.balance < totalCost) {
    return createError(ERROR_MESSAGES.INSUFFICIENT_BALANCE);
  }
  
  return null;
}

export function calculateSpread(marketPrice: number): number {
  return marketPrice * SPREAD_MARGIN;
}

export function calculateExpectedBuyPrice(marketPrice: number): number {
  return marketPrice + calculateSpread(marketPrice);
}

export function validateBuyPriceWithSpread(
  quotedPrice: number,
  marketPrice: number
): string | null {
  const expectedBuyPrice = calculateExpectedBuyPrice(marketPrice);
  const priceDiff = Math.abs(quotedPrice - expectedBuyPrice);
  const threshold = expectedBuyPrice * PRICE_TOLERANCE_PERCENT;
  
  if (priceDiff > threshold) {
    return createError(ERROR_MESSAGES.INVALID_BUY_PRICE_SPREAD);
  }
  
  return null;
}

export function validatePriceFreshness(
  quotedPrice: number,
  orderType: string,
  currentMarketPrice?: number
): string | null {
  if (currentMarketPrice === undefined || !Number.isFinite(currentMarketPrice)) {
    return null;
  }

  if (orderType === 'buy') {
    return validateBuyPriceWithSpread(quotedPrice, currentMarketPrice);
  }

  const priceDiff = Math.abs(quotedPrice - currentMarketPrice);
  const threshold = currentMarketPrice * PRICE_TOLERANCE_PERCENT;
  
  if (priceDiff > threshold) {
    return createError(ERROR_MESSAGES.STALE_PRICE);
  }
  
  return null;
}

export function getTodayOrderTotal(dailyHistory?: DailyOrderHistory): number {
  if (!dailyHistory || !dailyHistory.orders) {
    return 0;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return dailyHistory.orders
    .filter(order => {
      const orderDate = new Date(order.timestamp);
      orderDate.setHours(0, 0, 0, 0);
      return orderDate.getTime() === today.getTime();
    })
    .reduce((total, order) => total + order.quantity, 0);
}

export function validateDailyLimit(
  quantity: number,
  dailyHistory?: DailyOrderHistory
): { error: string | null; remainingAllowance: number } {
  const todayTotal = getTodayOrderTotal(dailyHistory);
  const newTotal = todayTotal + quantity;
  const remainingAllowance = DAILY_TRADING_LIMIT - todayTotal;

  if (newTotal > DAILY_TRADING_LIMIT) {
    return {
      error: createError(ERROR_MESSAGES.DAILY_LIMIT_EXCEEDED),
      remainingAllowance,
    };
  }

  return {
    error: null,
    remainingAllowance,
  };
}
