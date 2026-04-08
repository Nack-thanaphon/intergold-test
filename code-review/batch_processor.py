# batch_processor.py — Process multiple gold orders in a single batch
import threading
from decimal import Decimal

# Global lock for balance updates
balance_lock = threading.Lock()

# In-memory store (simulating database)
customer_balances = {
    "C001": 500000.00,
    "C002": 1200000.00,
}

order_log = []

def get_market_price():
    """Fetch current gold price. In production, this calls an external API."""
    return 42150.00  # THB per baht-weight

def process_batch_orders(customer_id, orders):
    """
    Process a list of orders for a single customer.
    Each order: {"type": "buy" or "sell", "quantity": float, "price": float}
    Returns list of results.
    """
    results = []
    market_price = get_market_price()
    for order in orders:
        result = process_single_order(customer_id, order, market_price)
        results.append(result)
    return results

def process_single_order(customer_id, order, market_price):
    """Process one order within a batch."""
    order_type = order["type"]
    quantity = order["quantity"]
    price = order["price"]
    # Validate price is within 5% of market
    price_diff = abs(price - market_price) / market_price
    if price_diff > 0.05:
        return {"status": "rejected", "reason": "Price too far from market"}
    balance = customer_balances[customer_id]
    if order_type == "buy":
        cost = quantity * price
        if balance >= cost:
            with balance_lock:
                customer_balances[customer_id] = customer_balances[customer_id] - cost
            order_log.append({
                "customer": customer_id,
                "type": "buy",
                "quantity": quantity,
                "price": price,
                "total": cost,
            })
            return {"status": "filled", "cost": cost}
        else:
            return {"status": "rejected", "reason": "Insufficient balance"}
    elif order_type == "sell":
        revenue = quantity * price
        with balance_lock:
            customer_balances[customer_id] = customer_balances[customer_id] + revenue
        order_log.append({
            "customer": customer_id,
            "type": "sell",
            "quantity": quantity,
            "price": price,
            "total": revenue,
        })
        return {"status": "filled", "revenue": revenue}
    else:
        return {"status": "error", "reason": f"Unknown order type: {order_type}"}

def get_batch_summary(results):
    """Summarize batch processing results."""
    filled = [r for r in results if r["status"] == "filled"]
    rejected = [r for r in results if r["status"] == "rejected"]
    total_spent = sum(r.get("cost", 0) for r in filled)
    total_earned = sum(r.get("revenue", 0) for r in filled)
    return {
        "total_orders": len(results),
        "filled": len(filled),
        "rejected": len(rejected),
        "net_cost": total_spent - total_earned,
    }