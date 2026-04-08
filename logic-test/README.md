# Order Validation Module

Gold trading order validation module with spread calculation and daily trading limits.

## Features

- ✅ Order type validation (buy/sell)
- ✅ Quantity validation (multiples of 0.5 baht-weight)
- ✅ Balance validation for buy orders
- ✅ Spread calculation (0.5% margin on buy orders)
- ✅ Price freshness validation (±2% tolerance)
- ✅ Daily trading limits (5 baht-weight per customer per day)

## Installation

```bash
npm install
```

## Usage

### Basic Example

```typescript
import { validateOrder, Order, CustomerBalance } from './orderValidation';

const order: Order = {
  customer_id: 'C001',
  order_type: 'buy',
  quantity: 2.0,
  price_freshness: 30150,
};

const customerBalance: CustomerBalance = {
  balance: 100000,
};

const currentMarketPrice = 30000;

const result = validateOrder(order, customerBalance, currentMarketPrice);

if (result.valid) {
  console.log('Order is valid!');
  console.log('Spread:', result.spread, 'THB');
  console.log('Remaining allowance:', result.remainingAllowance);
} else {
  console.log('Order validation failed:', result.errors);
}
```

## Running Examples

```bash
# Run example scenarios
npm run example

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## Validation Rules

### 1. Order Type
- Must be either `"buy"` or `"sell"`

### 2. Quantity
- Must be positive
- Must be in multiples of 0.5 baht-weight (e.g., 0.5, 1.0, 1.5, 2.0, 2.5)

### 3. Sufficient Balance (Buy Orders Only)
- Customer balance must be ≥ quantity × price

### 4. Spread Calculation (Buy Orders)
- Buy price = market price + 0.5% spread
- Quoted price must be within ±2% of expected buy price

### 5. Price Freshness (Sell Orders)
- Quoted price must be within ±2% of current market price

### 6. Daily Trading Limit
- Maximum 5 baht-weight per customer per day
- Returns remaining allowance

## API

### `validateOrder(order, customerBalance?, currentMarketPrice?, dailyOrderHistory?)`

**Parameters:**
- `order: Order` - The order to validate
- `customerBalance?: CustomerBalance` - Optional customer balance for buy order validation
- `currentMarketPrice?: number` - Optional current market price for price freshness validation
- `dailyOrderHistory?: DailyOrderHistory` - Optional daily order history for limit validation

**Returns:** `ValidationResult`
```typescript
{
  valid: boolean;
  errors?: string[];
  spread?: number;              // Only for buy orders
  remainingAllowance?: number;  // Daily limit remaining
}
```

## Project Structure

```
src/
├── orderValidation/
│   ├── types.ts              # TypeScript interfaces
│   ├── constants.ts          # Constants and error messages
│   ├── helpers.ts            # Validation helper functions
│   ├── orderValidation.ts    # Main validation logic
│   ├── index.ts              # Public exports
│   └── __tests__/
│       └── orderValidation.test.ts  # 38 comprehensive tests
└── example.ts                # Usage examples
```

## Test Coverage

- **38 tests** covering all validation rules
- **100% passing** rate
- Edge cases and boundary conditions tested

Run tests:
```bash
npm test
```

## License

ISC
