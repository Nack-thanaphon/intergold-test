import { CustomerBalance, DailyOrderHistory, ORDER_TYPE } from './types';
import { VALID_ORDER_TYPES, PRICE_TOLERANCE_PERCENT, SPREAD_MARGIN, DAILY_TRADING_LIMIT, ERROR_MESSAGES } from './constants';

export function validateOrderType(orderType: string): string | null {
  if (!orderType || !(VALID_ORDER_TYPES as readonly string[]).includes(orderType)) {
    return ERROR_MESSAGES.INVALID_ORDER_TYPE;
  }
  return null;
}

export function validateQuantity(quantity: number): string | null {
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return ERROR_MESSAGES.INVALID_QUANTITY_POSITIVE;
  }
  
  if ((quantity * 2) % 1 !== 0) {
    return ERROR_MESSAGES.INVALID_QUANTITY_INCREMENT;
  }
  
  return null;
}

export function validateBalance(
  orderType: string,
  quantity: number,
  price: number,
  customerBalance?: CustomerBalance
): string | null {
  if (orderType !== ORDER_TYPE.BUY || !customerBalance) {
    return null;
  }

  const totalCost = quantity * price;
  if (customerBalance.balance < totalCost) {
    return ERROR_MESSAGES.INSUFFICIENT_BALANCE;
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
    return ERROR_MESSAGES.INVALID_BUY_PRICE_SPREAD;
  }
  
  return null;
}

export function validateQuotedPrice(
  orderType: string,
  quotedPrice: number,
  currentMarketPrice?: number
): string | null {
  if (!Number.isFinite(quotedPrice) || quotedPrice <= 0) {
    return 'Quoted price must be a positive number';
  }

  if (currentMarketPrice === undefined || !Number.isFinite(currentMarketPrice)) {
    return null;
  }

  if (orderType === ORDER_TYPE.BUY) {
    return validateBuyPriceWithSpread(quotedPrice, currentMarketPrice);
  }

  const priceDiff = Math.abs(quotedPrice - currentMarketPrice);
  const threshold = currentMarketPrice * PRICE_TOLERANCE_PERCENT;
  
  if (priceDiff > threshold) {
    return ERROR_MESSAGES.STALE_PRICE;
  }
  
  return null;
}

export function getTodayOrderTotal(dailyHistory?: DailyOrderHistory, currentDate: Date = new Date()): number {
  if (!dailyHistory || !dailyHistory.orders) {
    return 0;
  }

  const today = new Date(currentDate);
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
  dailyHistory?: DailyOrderHistory,
  currentDate?: Date
): { error: string | null; remainQuota: number } {
  const todayTotal = getTodayOrderTotal(dailyHistory, currentDate);
  const newTotal = todayTotal + quantity;
  const remainQuota = DAILY_TRADING_LIMIT - todayTotal;

  if (newTotal > DAILY_TRADING_LIMIT) {
    return {
      error: ERROR_MESSAGES.DAILY_LIMIT_EXCEEDED,
      remainQuota,
    };
  }

  return {
    error: null,
    remainQuota,
  };
}
