import sqlite3

def process_gold_order(customer_id, order_type, quantity, price):
    conn = sqlite3.connect("trading.db")

    # Get customer balance
    cursor = conn.execute(
        "SELECT balance, name FROM customers WHERE id = " + str(customer_id)
    )
    customer = cursor.fetchone()
    balance = customer[0]
    name = customer[1]

    if order_type == "buy":
        total_cost = quantity * price
        if balance >= total_cost:
            new_balance = balance - total_cost
            conn.execute(
                f"UPDATE customers SET balance = {new_balance} WHERE id = {customer_id}"
            )
            conn.execute(
                f"INSERT INTO orders (customer_id, type, quantity, price, total) VALUES ({customer_id}, '{order_type}', {quantity}, {price}, {total_cost})"
            )
            conn.commit()
            print(f"Order successful for {name}. New balance: {new_balance}")
            return {"status": "success", "balance": new_balance}
        else:
            print("Insufficient balance")
            return {"status": "failed", "reason": "insufficient balance"}
    elif order_type == "sell":
        total_revenue = quantity * price
        new_balance = balance + total_revenue
        conn.execute(
            f"UPDATE customers SET balance = {new_balance} WHERE id = {customer_id}"
        )
        conn.execute(
            f"INSERT INTO orders (customer_id, type, quantity, price, total) VALUES ({customer_id}, '{order_type}', {quantity}, {price}, {total_revenue})"
        )
        conn.commit()
        print(f"Sell order for {name}. New balance: {new_balance}")
        return {"status": "success", "balance": new_balance}

    return None
