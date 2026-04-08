import * as fs from "fs";
import * as path from "path";
import { validateOrder } from "./orderValidation";
import { CustomerBalance, DailyOrderHistory } from "./orderValidation/types";

const load = (file: string) =>
  JSON.parse(fs.readFileSync(path.join(__dirname, "__mock__", file), "utf-8"));

const customers: Record<string, CustomerBalance> = load("customers.json");
const market = load("market.json");
const dailyHistoryRaw = load("dailyHistory.json");
const testCases = load("testCases.json").cases;

const dailyHistory: Record<string, DailyOrderHistory> = {};
Object.keys(dailyHistoryRaw).forEach((id) => {
  dailyHistory[id] = {
    ...dailyHistoryRaw[id],
    orders: dailyHistoryRaw[id].orders.map((o: any) => ({
      quantity: o.quantity,
      timestamp: new Date(o.timestamp),
    })),
  };
});

function printResult(
  caseId: number,
  name: string,
  description: string,
  result: any,
) {
  console.log("\n" + "=".repeat(60));
  console.log(`Case ${caseId}: ${name}`);
  console.log("=".repeat(60));
  console.log("Description:", description);
  console.log("\nResult:");
  console.log(
    JSON.stringify(
      { valid: result.valid, errors: result.errors || [] },
      null,
      2,
    ),
  );
  if (caseId === 10) console.log("=".repeat(60) + "\n");
}

function runCase(caseId: number) {
  const testCase = testCases.find((tc: any) => tc.id === caseId);

  if (!testCase) {
    console.log(`\nCase ${caseId} not found\n`);
    return;
  }

  if (!testCase.enabled) {
    console.log(`\nCase ${caseId} is disabled: ${testCase.name}\n`);
    return;
  }

  const result = validateOrder(
    testCase.order,
    testCase.useCustomerBalance
      ? customers[testCase.order.customer_id]
      : undefined,
    testCase.useMarketPrice ? market.currentPrice : undefined,
    testCase.useDailyHistory
      ? dailyHistory[testCase.order.customer_id]
      : undefined,
  );

  printResult(caseId, testCase.name, testCase.description, result);
}

// Case 1: Valid buy order (pass)
// Case 2: Valid sell order (pass)
// Case 3: Invalid order_type "transfer" (fail)
// Case 4: Quantity = 0 (fail)
// Case 5: Quantity = 1.3 ไม่ใช่ multiple of 0.5 (fail)
// Case 6: Balance ไม่พอ (fail)
// Case 7: ราคาห่างจาก market เกิน 2% (fail)
// Case 8: ราคาพอดีขอบ 2% (pass)
// Case 9: Quantity ติดลบ (fail)
// Case 10: Sell ไม่เช็ค balance (pass)

// Run all test cases
for (let i = 1; i <= 10; i++) {
  runCase(i);
}
