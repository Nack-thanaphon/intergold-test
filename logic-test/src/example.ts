import { validateOrder, Order, CustomerBalance, DailyOrderHistory } from './orderValidation/orderValidation';

console.log('=== Order Validation Examples ===\n');

// Example 1: Valid buy order
console.log('1. Valid Buy Order:');
const order1: Order = {
  customer_id: 'C001',
  order_type: 'buy',
  quantity: 2.0,
  price_freshness: 30150,
};
const balance1: CustomerBalance = { balance: 100000 };
const marketPrice1 = 30000;
const result1 = validateOrder(order1, balance1, marketPrice1);
console.log('Result:', result1);
console.log('Spread:', result1.spread, 'THB');
console.log('Remaining Allowance:', result1.remainingAllowance, 'baht-weight\n');

// Example 2: Insufficient balance
console.log('2. Insufficient Balance:');
const order2: Order = {
  customer_id: 'C002',
  order_type: 'buy',
  quantity: 5.0,
  price_freshness: 30150,
};
const balance2: CustomerBalance = { balance: 50000 };
const result2 = validateOrder(order2, balance2, 30000);
console.log('Result:', result2);
console.log('Errors:', result2.errors, '\n');

// Example 3: Invalid quantity (not multiple of 0.5)
console.log('3. Invalid Quantity:');
const order3: Order = {
  customer_id: 'C003',
  order_type: 'buy',
  quantity: 1.3,
  price_freshness: 30000,
};
const result3 = validateOrder(order3);
console.log('Result:', result3);
console.log('Errors:', result3.errors, '\n');

// Example 4: Daily limit exceeded
console.log('4. Daily Limit Exceeded:');
const order4: Order = {
  customer_id: 'C004',
  order_type: 'sell',
  quantity: 3.0,
  price_freshness: 30000,
};
const dailyHistory4: DailyOrderHistory = {
  customer_id: 'C004',
  orders: [
    { quantity: 2.5, timestamp: new Date() },
  ],
};
const result4 = validateOrder(order4, undefined, undefined, dailyHistory4);
console.log('Result:', result4);
console.log('Errors:', result4.errors);
console.log('Remaining Allowance:', result4.remainingAllowance, 'baht-weight\n');

// Example 5: Valid sell order
console.log('5. Valid Sell Order:');
const order5: Order = {
  customer_id: 'C005',
  order_type: 'sell',
  quantity: 1.5,
  price_freshness: 29700,
};
const result5 = validateOrder(order5, undefined, 30000);
console.log('Result:', result5);
console.log('No spread for sell orders:', result5.spread === undefined);
console.log('Remaining Allowance:', result5.remainingAllowance, 'baht-weight\n');

// Example 6: Price outside spread tolerance
console.log('6. Price Outside Spread Tolerance (Buy Order):');
const order6: Order = {
  customer_id: 'C006',
  order_type: 'buy',
  quantity: 1.0,
  price_freshness: 31000,
};
const result6 = validateOrder(order6, undefined, 30000);
console.log('Result:', result6);
console.log('Errors:', result6.errors, '\n');

// Example 7: Multiple validation errors
console.log('7. Multiple Validation Errors:');
const order7: Order = {
  customer_id: 'C007',
  order_type: 'invalid',
  quantity: -1.3,
  price_freshness: 35000,
};
const result7 = validateOrder(order7, { balance: 1000 }, 30000);
console.log('Result:', result7);
console.log('All Errors:', result7.errors, '\n');

console.log('=== Summary ===');
console.log('Total examples: 7');
console.log('Valid orders: 2');
console.log('Invalid orders: 5');
