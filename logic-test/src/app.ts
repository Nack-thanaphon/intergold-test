import express, { Request, Response } from "express";
import { validateOrder } from "./orderValidation";
import { CustomerBalance, DailyOrderHistory, Order } from "./orderValidation/types";

const app = express();
const PORT = 3000;

app.use(express.json());

interface ValidateOrderRequest {
  order: Order;
  customerBalance?: CustomerBalance;
  currentMarketPrice?: number;
  dailyOrderHistory?: DailyOrderHistory;
}

app.post("/validate-order", (req: Request<{}, {}, ValidateOrderRequest>, res: Response) => {
  try {
    const { order, customerBalance, currentMarketPrice, dailyOrderHistory } = req.body;

    if (!order) {
      return res.status(400).json({
        error: "Order is required",
      });
    }

    const result = validateOrder(
      order,
      customerBalance,
      currentMarketPrice,
      dailyOrderHistory
    );

    return res.status(200).json({
      valid: result.valid,
      errors: result.errors || [],
      spread: result.spread,
      remainingAllowance: result.remainingAllowance,
    });
  } catch (error) {
    return res.status(500).json({
      error: "Internal server error",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`server running on http://localhost:${PORT}`);
});
