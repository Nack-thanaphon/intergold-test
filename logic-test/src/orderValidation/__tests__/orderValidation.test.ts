import { validateOrder, Order, CustomerBalance, ValidationResult, DailyOrderHistory } from '../orderValidation';

describe('Order Validation Module', () => {
  describe('Rule 1: Order type validation', () => {
    it('should accept "buy" as valid order type', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'buy',
        quantity: 1.0,
        price_freshness: 30000,
      };
      const result = validateOrder(order);
      expect(result.valid).toBe(true);
    });

    it('should accept "sell" as valid order type', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'sell',
        quantity: 1.0,
        price_freshness: 30000,
      };
      const result = validateOrder(order);
      expect(result.valid).toBe(true);
    });

    it('should reject invalid order type', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'trade',
        quantity: 1.0,
        price_freshness: 30000,
      };
      const result = validateOrder(order);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Order type must be either "buy" or "sell"');
    });

    it('should reject empty order type', () => {
      const order: Order = {
        customer_id: 1,
        order_type: '',
        quantity: 1.0,
        price_freshness: 30000,
      };
      const result = validateOrder(order);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Order type must be either "buy" or "sell"');
    });
  });

  describe('Rule 2: Quantity validation (multiples of 0.5 baht-weight)', () => {
    it('should accept quantity of 1.0', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'buy',
        quantity: 1.0,
        price_freshness: 30000,
      };
      const result = validateOrder(order);
      expect(result.valid).toBe(true);
    });

    it('should accept quantity of 1.5', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'buy',
        quantity: 1.5,
        price_freshness: 30000,
      };
      const result = validateOrder(order);
      expect(result.valid).toBe(true);
    });

    it('should accept quantity of 2.5', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'buy',
        quantity: 2.5,
        price_freshness: 30000,
      };
      const result = validateOrder(order);
      expect(result.valid).toBe(true);
    });

    it('should reject quantity of 1.3 (not a multiple of 0.5)', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'buy',
        quantity: 1.3,
        price_freshness: 30000,
      };
      const result = validateOrder(order);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Quantity must be in multiples of 0.5 baht-weight (e.g., 1.0, 1.5, 2.5)'
      );
    });

    it('should reject negative quantity', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'buy',
        quantity: -1.0,
        price_freshness: 30000,
      };
      const result = validateOrder(order);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Quantity must be a positive number (multiples of 0.5 baht-weight)');
    });

    it('should reject zero quantity', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'buy',
        quantity: 0,
        price_freshness: 30000,
      };
      const result = validateOrder(order);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Quantity must be a positive number (multiples of 0.5 baht-weight)');
    });
  });

  describe('Rule 3: Sufficient balance for buy orders', () => {
    it('should accept buy order when balance is sufficient', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'buy',
        quantity: 2.0,
        price_freshness: 30000,
      };
      const customerBalance: CustomerBalance = {
        balance: 100000,
      };
      const result = validateOrder(order, customerBalance);
      expect(result.valid).toBe(true);
    });

    it('should accept buy order when balance exactly equals total cost', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'buy',
        quantity: 2.0,
        price_freshness: 30000,
      };
      const customerBalance: CustomerBalance = {
        balance: 60000,
      };
      const result = validateOrder(order, customerBalance);
      expect(result.valid).toBe(true);
    });

    it('should reject buy order when balance is insufficient', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'buy',
        quantity: 3.0,
        price_freshness: 30000,
      };
      const customerBalance: CustomerBalance = {
        balance: 50000,
      };
      const result = validateOrder(order, customerBalance);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        "Insufficient balance: customer's available balance must be sufficient to cover quantity × price"
      );
    });

    it('should not check balance for sell orders', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'sell',
        quantity: 2.0,
        price_freshness: 30000,
      };
      const customerBalance: CustomerBalance = {
        balance: 0,
      };
      const result = validateOrder(order, customerBalance);
      expect(result.valid).toBe(true);
    });
  });

  describe('Rule 4: Price freshness (within 2% of market price)', () => {
    it('should accept price within 2% of market price', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'buy',
        quantity: 1.0,
        price_freshness: 30500,
      };
      const currentMarketPrice = 30000;
      const result = validateOrder(order, undefined, currentMarketPrice);
      expect(result.valid).toBe(true);
    });

    it('should accept price exactly at market price', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'buy',
        quantity: 1.0,
        price_freshness: 30000,
      };
      const currentMarketPrice = 30000;
      const result = validateOrder(order, undefined, currentMarketPrice);
      expect(result.valid).toBe(true);
    });

    it('should accept price at exactly 2% above market price', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'buy',
        quantity: 1.0,
        price_freshness: 30600,
      };
      const currentMarketPrice = 30000;
      const result = validateOrder(order, undefined, currentMarketPrice);
      expect(result.valid).toBe(true);
    });

    it('should accept price at exactly 2% below market price (sell order)', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'sell',
        quantity: 1.0,
        price_freshness: 29400,
      };
      const currentMarketPrice = 30000;
      const result = validateOrder(order, undefined, currentMarketPrice);
      expect(result.valid).toBe(true);
    });

    it('should reject price more than 2% above market price (sell order)', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'sell',
        quantity: 1.0,
        price_freshness: 31000,
      };
      const currentMarketPrice = 30000;
      const result = validateOrder(order, undefined, currentMarketPrice);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Price freshness: the quoted price must be within 2% of the current market price (to prevent stale quotes)'
      );
    });

    it('should reject price more than 2% below market price (sell order)', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'sell',
        quantity: 1.0,
        price_freshness: 29000,
      };
      const currentMarketPrice = 30000;
      const result = validateOrder(order, undefined, currentMarketPrice);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        'Price freshness: the quoted price must be within 2% of the current market price (to prevent stale quotes)'
      );
    });
  });

  describe('Combined validation scenarios', () => {
    it('should return multiple errors when multiple rules are violated', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'invalid',
        quantity: -1.3,
        price_freshness: 35000,
      };
      const customerBalance: CustomerBalance = {
        balance: 1000,
      };
      const currentMarketPrice = 30000;
      const result = validateOrder(order, customerBalance, currentMarketPrice);
      expect(result.valid).toBe(false);
      expect(result.errors?.length).toBeGreaterThan(1);
    });

    it('should validate a perfect buy order with all checks', () => {
      const order: Order = {
        customer_id: 'CUST001',
        order_type: 'buy',
        quantity: 2.5,
        price_freshness: 30300,
      };
      const customerBalance: CustomerBalance = {
        balance: 100000,
      };
      const currentMarketPrice = 30000;
      const result = validateOrder(order, customerBalance, currentMarketPrice);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });

    it('should validate a perfect sell order', () => {
      const order: Order = {
        customer_id: 'CUST002',
        order_type: 'sell',
        quantity: 1.5,
        price_freshness: 29700,
      };
      const currentMarketPrice = 30000;
      const result = validateOrder(order, undefined, currentMarketPrice);
      expect(result.valid).toBe(true);
      expect(result.errors).toBeUndefined();
    });
  });

  describe('Edge cases and graceful error handling', () => {
    it('should handle missing customer balance gracefully for buy orders', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'buy',
        quantity: 1.0,
        price_freshness: 30000,
      };
      const result = validateOrder(order);
      expect(result.valid).toBe(true);
    });

    it('should handle missing market price gracefully', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'buy',
        quantity: 1.0,
        price_freshness: 30000,
      };
      const result = validateOrder(order);
      expect(result.valid).toBe(true);
    });

    it('should handle very large quantities correctly', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'buy',
        quantity: 4.5,
        price_freshness: 30000,
      };
      const result = validateOrder(order);
      expect(result.valid).toBe(true);
    });

    it('should handle decimal precision correctly', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'buy',
        quantity: 0.5,
        price_freshness: 30000,
      };
      const result = validateOrder(order);
      expect(result.valid).toBe(true);
    });
  });

  describe('Part 3: Spread Calculation', () => {
    it('should calculate spread for buy orders', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'buy',
        quantity: 1.0,
        price_freshness: 30150,
      };
      const currentMarketPrice = 30000;
      const result = validateOrder(order, undefined, currentMarketPrice);
      
      expect(result.spread).toBeDefined();
      expect(result.spread).toBe(150);
    });

    it('should not calculate spread for sell orders', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'sell',
        quantity: 1.0,
        price_freshness: 30000,
      };
      const currentMarketPrice = 30000;
      const result = validateOrder(order, undefined, currentMarketPrice);
      
      expect(result.spread).toBeUndefined();
    });

    it('should validate buy price with spread (within tolerance)', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'buy',
        quantity: 1.0,
        price_freshness: 30150,
      };
      const currentMarketPrice = 30000;
      const result = validateOrder(order, undefined, currentMarketPrice);
      
      expect(result.valid).toBe(true);
    });

    it('should reject buy price outside spread tolerance', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'buy',
        quantity: 1.0,
        price_freshness: 31000,
      };
      const currentMarketPrice = 30000;
      const result = validateOrder(order, undefined, currentMarketPrice);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Buy price must be within 2% of expected price (market price + 0.5% spread)');
    });

    it('should accept buy price at expected price (market + 0.5%)', () => {
      const order: Order = {
        customer_id: 1,
        order_type: 'buy',
        quantity: 2.0,
        price_freshness: 30150,
      };
      const currentMarketPrice = 30000;
      const result = validateOrder(order, undefined, currentMarketPrice);
      
      expect(result.valid).toBe(true);
      expect(result.spread).toBe(150);
    });
  });

  describe('Part 3: Daily Trading Limits', () => {
    it('should accept order within daily limit', () => {
      const order: Order = {
        customer_id: 'C001',
        order_type: 'buy',
        quantity: 2.0,
        price_freshness: 30000,
      };
      const dailyHistory: DailyOrderHistory = {
        customer_id: 'C001',
        orders: [
          { quantity: 1.5, timestamp: new Date() },
        ],
      };
      
      const result = validateOrder(order, undefined, undefined, dailyHistory);
      
      expect(result.valid).toBe(true);
      expect(result.remainingAllowance).toBe(3.5);
    });

    it('should reject order exceeding daily limit', () => {
      const order: Order = {
        customer_id: 'C001',
        order_type: 'buy',
        quantity: 3.0,
        price_freshness: 30000,
      };
      const dailyHistory: DailyOrderHistory = {
        customer_id: 'C001',
        orders: [
          { quantity: 2.5, timestamp: new Date() },
        ],
      };
      
      const result = validateOrder(order, undefined, undefined, dailyHistory);
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Daily trading limit exceeded. Maximum 5 baht-weight per day');
      expect(result.remainingAllowance).toBe(2.5);
    });

    it('should accept order exactly at daily limit', () => {
      const order: Order = {
        customer_id: 'C001',
        order_type: 'sell',
        quantity: 2.0,
        price_freshness: 30000,
      };
      const dailyHistory: DailyOrderHistory = {
        customer_id: 'C001',
        orders: [
          { quantity: 3.0, timestamp: new Date() },
        ],
      };
      
      const result = validateOrder(order, undefined, undefined, dailyHistory);
      
      expect(result.valid).toBe(true);
      expect(result.remainingAllowance).toBe(2.0);
    });

    it('should handle no daily history (new customer)', () => {
      const order: Order = {
        customer_id: 'C002',
        order_type: 'buy',
        quantity: 4.5,
        price_freshness: 30000,
      };
      
      const result = validateOrder(order);
      
      expect(result.valid).toBe(true);
      expect(result.remainingAllowance).toBe(5);
    });

    it('should only count today orders in daily limit', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const order: Order = {
        customer_id: 'C001',
        order_type: 'buy',
        quantity: 4.0,
        price_freshness: 30000,
      };
      const dailyHistory: DailyOrderHistory = {
        customer_id: 'C001',
        orders: [
          { quantity: 3.0, timestamp: yesterday },
          { quantity: 0.5, timestamp: new Date() },
        ],
      };
      
      const result = validateOrder(order, undefined, undefined, dailyHistory);
      
      expect(result.valid).toBe(true);
      expect(result.remainingAllowance).toBe(4.5);
    });

    it('should show correct remaining allowance when limit exceeded', () => {
      const order: Order = {
        customer_id: 'C001',
        order_type: 'buy',
        quantity: 5.0,
        price_freshness: 30000,
      };
      const dailyHistory: DailyOrderHistory = {
        customer_id: 'C001',
        orders: [
          { quantity: 4.0, timestamp: new Date() },
        ],
      };
      
      const result = validateOrder(order, undefined, undefined, dailyHistory);
      
      expect(result.valid).toBe(false);
      expect(result.remainingAllowance).toBe(1.0);
    });
  });
});
