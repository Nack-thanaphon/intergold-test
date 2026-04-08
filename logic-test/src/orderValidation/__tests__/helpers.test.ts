import { expect, it, describe } from '@jest/globals';
import {
  createError,
  validateOrderType,
  validateQuantity,
  validateBalance,
  calculateSpread,
  calculateExpectedBuyPrice,
  validateBuyPriceWithSpread,
  validatePriceFreshness,
  getTodayOrderTotal,
  validateDailyLimit,
} from '../helpers';
import { CustomerBalance, DailyOrderHistory } from '../types';
import { ERROR_MESSAGES, SPREAD_MARGIN, PRICE_TOLERANCE_PERCENT, DAILY_TRADING_LIMIT } from '../constants';

describe('Helper Functions', () => {
  describe('createError', () => {
    it('should return the error message', () => {
      const message = 'Test error';
      expect(createError(message)).toBe(message);
    });

    it('should handle empty string', () => {
      expect(createError('')).toBe('');
    });
  });

  describe('validateOrderType', () => {
    it('should return null for valid "buy" order type', () => {
      expect(validateOrderType('buy')).toBeNull();
    });

    it('should return null for valid "sell" order type', () => {
      expect(validateOrderType('sell')).toBeNull();
    });

    it('should return error for invalid order type', () => {
      expect(validateOrderType('invalid')).toBe(ERROR_MESSAGES.INVALID_ORDER_TYPE);
    });

    it('should return error for empty string', () => {
      expect(validateOrderType('')).toBe(ERROR_MESSAGES.INVALID_ORDER_TYPE);
    });

    it('should return error for null/undefined', () => {
      expect(validateOrderType(null as any)).toBe(ERROR_MESSAGES.INVALID_ORDER_TYPE);
      expect(validateOrderType(undefined as any)).toBe(ERROR_MESSAGES.INVALID_ORDER_TYPE);
    });

    it('should return error for case-sensitive mismatch', () => {
      expect(validateOrderType('BUY')).toBe(ERROR_MESSAGES.INVALID_ORDER_TYPE);
      expect(validateOrderType('SELL')).toBe(ERROR_MESSAGES.INVALID_ORDER_TYPE);
    });
  });

  describe('validateQuantity', () => {
    it('should return null for valid quantities in 0.5 increments', () => {
      expect(validateQuantity(0.5)).toBeNull();
      expect(validateQuantity(1.0)).toBeNull();
      expect(validateQuantity(1.5)).toBeNull();
      expect(validateQuantity(2.5)).toBeNull();
      expect(validateQuantity(10.0)).toBeNull();
    });

    it('should return error for zero quantity', () => {
      expect(validateQuantity(0)).toBe(ERROR_MESSAGES.INVALID_QUANTITY_POSITIVE);
    });

    it('should return error for negative quantity', () => {
      expect(validateQuantity(-1)).toBe(ERROR_MESSAGES.INVALID_QUANTITY_POSITIVE);
      expect(validateQuantity(-0.5)).toBe(ERROR_MESSAGES.INVALID_QUANTITY_POSITIVE);
    });

    it('should return error for non-finite values', () => {
      expect(validateQuantity(Infinity)).toBe(ERROR_MESSAGES.INVALID_QUANTITY_POSITIVE);
      expect(validateQuantity(-Infinity)).toBe(ERROR_MESSAGES.INVALID_QUANTITY_POSITIVE);
      expect(validateQuantity(NaN)).toBe(ERROR_MESSAGES.INVALID_QUANTITY_POSITIVE);
    });

    it('should return error for quantities not in 0.5 increments', () => {
      expect(validateQuantity(0.3)).toBe(ERROR_MESSAGES.INVALID_QUANTITY_INCREMENT);
      expect(validateQuantity(1.2)).toBe(ERROR_MESSAGES.INVALID_QUANTITY_INCREMENT);
      expect(validateQuantity(2.7)).toBe(ERROR_MESSAGES.INVALID_QUANTITY_INCREMENT);
      expect(validateQuantity(1.25)).toBe(ERROR_MESSAGES.INVALID_QUANTITY_INCREMENT);
    });
  });

  describe('validateBalance', () => {
    it('should return null for sell orders (balance check not required)', () => {
      const balance: CustomerBalance = { balance: 0 };
      expect(validateBalance('sell', 1, 1000, balance)).toBeNull();
    });

    it('should return null when customerBalance is not provided', () => {
      expect(validateBalance('buy', 1, 1000)).toBeNull();
    });

    it('should return null when customer has sufficient balance', () => {
      const balance: CustomerBalance = { balance: 10000 };
      expect(validateBalance('buy', 1, 5000, balance)).toBeNull();
    });

    it('should return null when customer has exact balance', () => {
      const balance: CustomerBalance = { balance: 5000 };
      expect(validateBalance('buy', 1, 5000, balance)).toBeNull();
    });

    it('should return error when customer has insufficient balance', () => {
      const balance: CustomerBalance = { balance: 4999 };
      expect(validateBalance('buy', 1, 5000, balance)).toBe(ERROR_MESSAGES.INSUFFICIENT_BALANCE);
    });

    it('should calculate total cost correctly for multiple quantities', () => {
      const balance: CustomerBalance = { balance: 10000 };
      expect(validateBalance('buy', 2.5, 4000, balance)).toBeNull();
      
      const insufficientBalance: CustomerBalance = { balance: 9999 };
      expect(validateBalance('buy', 2.5, 4000, insufficientBalance)).toBe(ERROR_MESSAGES.INSUFFICIENT_BALANCE);
    });
  });

  describe('calculateSpread', () => {
    it('should calculate spread correctly', () => {
      expect(calculateSpread(1000)).toBe(1000 * SPREAD_MARGIN);
      expect(calculateSpread(2000)).toBe(2000 * SPREAD_MARGIN);
    });

    it('should handle zero market price', () => {
      expect(calculateSpread(0)).toBe(0);
    });

    it('should handle decimal market prices', () => {
      expect(calculateSpread(1234.56)).toBe(1234.56 * SPREAD_MARGIN);
    });
  });

  describe('calculateExpectedBuyPrice', () => {
    it('should calculate expected buy price with spread', () => {
      const marketPrice = 1000;
      const spread = marketPrice * SPREAD_MARGIN;
      expect(calculateExpectedBuyPrice(marketPrice)).toBe(marketPrice + spread);
    });

    it('should handle different market prices', () => {
      const marketPrice = 2500;
      const spread = marketPrice * SPREAD_MARGIN;
      expect(calculateExpectedBuyPrice(marketPrice)).toBe(marketPrice + spread);
    });
  });

  describe('validateBuyPriceWithSpread', () => {
    it('should return null when quoted price is within tolerance', () => {
      const marketPrice = 1000;
      const expectedBuyPrice = calculateExpectedBuyPrice(marketPrice);
      expect(validateBuyPriceWithSpread(expectedBuyPrice, marketPrice)).toBeNull();
    });

    it('should return null when quoted price is at the upper threshold', () => {
      const marketPrice = 1000;
      const expectedBuyPrice = calculateExpectedBuyPrice(marketPrice);
      const threshold = expectedBuyPrice * PRICE_TOLERANCE_PERCENT;
      const quotedPrice = expectedBuyPrice + threshold;
      expect(validateBuyPriceWithSpread(quotedPrice, marketPrice)).toBeNull();
    });

    it('should return null when quoted price is slightly within lower threshold', () => {
      const marketPrice = 1000;
      const expectedBuyPrice = calculateExpectedBuyPrice(marketPrice);
      const threshold = expectedBuyPrice * PRICE_TOLERANCE_PERCENT;
      const quotedPrice = expectedBuyPrice - threshold + 0.01;
      expect(validateBuyPriceWithSpread(quotedPrice, marketPrice)).toBeNull();
    });

    it('should return error when quoted price exceeds upper threshold', () => {
      const marketPrice = 1000;
      const expectedBuyPrice = calculateExpectedBuyPrice(marketPrice);
      const threshold = expectedBuyPrice * PRICE_TOLERANCE_PERCENT;
      const quotedPrice = expectedBuyPrice + threshold + 0.01;
      expect(validateBuyPriceWithSpread(quotedPrice, marketPrice)).toBe(ERROR_MESSAGES.INVALID_BUY_PRICE_SPREAD);
    });

    it('should return error when quoted price is below lower threshold', () => {
      const marketPrice = 1000;
      const expectedBuyPrice = calculateExpectedBuyPrice(marketPrice);
      const threshold = expectedBuyPrice * PRICE_TOLERANCE_PERCENT;
      const quotedPrice = expectedBuyPrice - threshold - 0.01;
      expect(validateBuyPriceWithSpread(quotedPrice, marketPrice)).toBe(ERROR_MESSAGES.INVALID_BUY_PRICE_SPREAD);
    });
  });

  describe('validatePriceFreshness', () => {
    it('should return null when currentMarketPrice is undefined', () => {
      expect(validatePriceFreshness(1000, 'buy', undefined)).toBeNull();
    });

    it('should return null when currentMarketPrice is not finite', () => {
      expect(validatePriceFreshness(1000, 'buy', NaN)).toBeNull();
      expect(validatePriceFreshness(1000, 'buy', Infinity)).toBeNull();
    });

    it('should validate buy orders with spread', () => {
      const marketPrice = 1000;
      const expectedBuyPrice = calculateExpectedBuyPrice(marketPrice);
      expect(validatePriceFreshness(expectedBuyPrice, 'buy', marketPrice)).toBeNull();
    });

    it('should return error for buy orders with invalid spread', () => {
      const marketPrice = 1000;
      const expectedBuyPrice = calculateExpectedBuyPrice(marketPrice);
      const threshold = expectedBuyPrice * PRICE_TOLERANCE_PERCENT;
      const invalidPrice = expectedBuyPrice + threshold + 1;
      expect(validatePriceFreshness(invalidPrice, 'buy', marketPrice)).toBe(ERROR_MESSAGES.INVALID_BUY_PRICE_SPREAD);
    });

    it('should return null for sell orders within tolerance', () => {
      const marketPrice = 1000;
      expect(validatePriceFreshness(marketPrice, 'sell', marketPrice)).toBeNull();
      
      const threshold = marketPrice * PRICE_TOLERANCE_PERCENT;
      expect(validatePriceFreshness(marketPrice + threshold, 'sell', marketPrice)).toBeNull();
      expect(validatePriceFreshness(marketPrice - threshold, 'sell', marketPrice)).toBeNull();
    });

    it('should return error for sell orders outside tolerance', () => {
      const marketPrice = 1000;
      const threshold = marketPrice * PRICE_TOLERANCE_PERCENT;
      
      expect(validatePriceFreshness(marketPrice + threshold + 0.01, 'sell', marketPrice)).toBe(ERROR_MESSAGES.STALE_PRICE);
      expect(validatePriceFreshness(marketPrice - threshold - 0.01, 'sell', marketPrice)).toBe(ERROR_MESSAGES.STALE_PRICE);
    });
  });

  describe('getTodayOrderTotal', () => {
    it('should return 0 when dailyHistory is undefined', () => {
      expect(getTodayOrderTotal(undefined)).toBe(0);
    });

    it('should return 0 when orders array is empty', () => {
      const history: DailyOrderHistory = {
        customer_id: 'C001',
        orders: [],
      };
      expect(getTodayOrderTotal(history)).toBe(0);
    });

    it('should return 0 when no orders are from today', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const history: DailyOrderHistory = {
        customer_id: 'C001',
        orders: [
          { quantity: 1, timestamp: yesterday },
          { quantity: 2, timestamp: yesterday },
        ],
      };
      expect(getTodayOrderTotal(history)).toBe(0);
    });

    it('should sum quantities for orders from today', () => {
      const today = new Date();
      
      const history: DailyOrderHistory = {
        customer_id: 'C001',
        orders: [
          { quantity: 1, timestamp: today },
          { quantity: 1.5, timestamp: today },
          { quantity: 0.5, timestamp: today },
        ],
      };
      expect(getTodayOrderTotal(history)).toBe(3);
    });

    it('should only count today orders, not yesterday orders', () => {
      const today = new Date();
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const history: DailyOrderHistory = {
        customer_id: 'C001',
        orders: [
          { quantity: 1, timestamp: today },
          { quantity: 2, timestamp: yesterday },
          { quantity: 1.5, timestamp: today },
        ],
      };
      expect(getTodayOrderTotal(history)).toBe(2.5);
    });

    it('should handle orders with different times on the same day', () => {
      const morning = new Date();
      morning.setHours(8, 0, 0, 0);
      
      const afternoon = new Date();
      afternoon.setHours(14, 30, 0, 0);
      
      const evening = new Date();
      evening.setHours(20, 45, 0, 0);
      
      const history: DailyOrderHistory = {
        customer_id: 'C001',
        orders: [
          { quantity: 1, timestamp: morning },
          { quantity: 1.5, timestamp: afternoon },
          { quantity: 0.5, timestamp: evening },
        ],
      };
      expect(getTodayOrderTotal(history)).toBe(3);
    });
  });

  describe('validateDailyLimit', () => {
    it('should allow order when no history exists', () => {
      const result = validateDailyLimit(2, undefined);
      expect(result.error).toBeNull();
      expect(result.remainingAllowance).toBe(DAILY_TRADING_LIMIT);
    });

    it('should allow order when within daily limit', () => {
      const history: DailyOrderHistory = {
        customer_id: 'C001',
        orders: [
          { quantity: 1, timestamp: new Date() },
        ],
      };
      const result = validateDailyLimit(2, history);
      expect(result.error).toBeNull();
      expect(result.remainingAllowance).toBe(4);
    });

    it('should allow order when exactly at daily limit', () => {
      const history: DailyOrderHistory = {
        customer_id: 'C001',
        orders: [
          { quantity: 2, timestamp: new Date() },
        ],
      };
      const result = validateDailyLimit(3, history);
      expect(result.error).toBeNull();
      expect(result.remainingAllowance).toBe(3);
    });

    it('should reject order when exceeding daily limit', () => {
      const history: DailyOrderHistory = {
        customer_id: 'C001',
        orders: [
          { quantity: 3, timestamp: new Date() },
        ],
      };
      const result = validateDailyLimit(2.5, history);
      expect(result.error).toBe(ERROR_MESSAGES.DAILY_LIMIT_EXCEEDED);
      expect(result.remainingAllowance).toBe(2);
    });

    it('should calculate remaining allowance correctly', () => {
      const history: DailyOrderHistory = {
        customer_id: 'C001',
        orders: [
          { quantity: 1.5, timestamp: new Date() },
          { quantity: 1, timestamp: new Date() },
        ],
      };
      const result = validateDailyLimit(1, history);
      expect(result.error).toBeNull();
      expect(result.remainingAllowance).toBe(2.5);
    });

    it('should not count yesterday orders in daily limit', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const history: DailyOrderHistory = {
        customer_id: 'C001',
        orders: [
          { quantity: 4, timestamp: yesterday },
          { quantity: 1, timestamp: new Date() },
        ],
      };
      const result = validateDailyLimit(3, history);
      expect(result.error).toBeNull();
      expect(result.remainingAllowance).toBe(4);
    });

    it('should reject when new order would exceed limit', () => {
      const history: DailyOrderHistory = {
        customer_id: 'C001',
        orders: [
          { quantity: 4.5, timestamp: new Date() },
        ],
      };
      const result = validateDailyLimit(1, history);
      expect(result.error).toBe(ERROR_MESSAGES.DAILY_LIMIT_EXCEEDED);
      expect(result.remainingAllowance).toBe(0.5);
    });
  });
});
