import { productRepository } from "../src/repositories/product.repository";
import { productSchema, updateProductSchema, productQuerySchema } from "../src/lib/validations/product";

function runUnitTests() {
  console.log("=================================================");
  console.log("🧪 PHASE 11: LOW STOCK & REORDERING UNIT TESTS");
  console.log("=================================================\n");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, testName: string, details?: string) {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${testName}${details ? ` -> ${details}` : ""}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}${details ? ` -> ${details}` : ""}`);
    }
  }

  // TEST 1 — Normal stock (100 vs min 50 -> IN_STOCK)
  const status1 = productRepository.computeStockStatus(100, 50);
  assert(status1 === "IN_STOCK", "Test 1 — Normal stock: 100 vs min 50", `Status: ${status1}`);

  // TEST 2 — Low stock (40 vs min 50 -> LOW_STOCK)
  const status2 = productRepository.computeStockStatus(40, 50);
  assert(status2 === "LOW_STOCK", "Test 2 — Low stock: 40 vs min 50", `Status: ${status2}`);

  // TEST 3 — Exactly minimum (50 vs min 50 -> IN_STOCK)
  const status3 = productRepository.computeStockStatus(50, 50);
  assert(status3 === "IN_STOCK", "Test 3 — Exactly minimum: 50 vs min 50", `Status: ${status3}`);

  // TEST 4 — Out of stock (0 vs min 50 -> OUT_OF_STOCK)
  const status4 = productRepository.computeStockStatus(0, 50);
  assert(status4 === "OUT_OF_STOCK", "Test 4 — Out of stock: 0 vs min 50", `Status: ${status4}`);

  // TEST 5 — Minimum = 0 (10 vs min 0 -> IN_STOCK)
  const status5 = productRepository.computeStockStatus(10, 0);
  assert(status5 === "IN_STOCK", "Test 5 — Minimum = 0: 10 vs min 0", `Status: ${status5}`);

  // TEST 6 — Out of stock with Minimum = 0 (0 vs min 0 -> OUT_OF_STOCK)
  const status6 = productRepository.computeStockStatus(0, 0);
  assert(status6 === "OUT_OF_STOCK", "Test 6 — Out of stock with Min = 0: 0 vs min 0", `Status: ${status6}`);

  // TEST 7 — Negative stock edge case (-5 vs min 50 -> OUT_OF_STOCK)
  const status7 = productRepository.computeStockStatus(-5, 50);
  assert(status7 === "OUT_OF_STOCK", "Test 7 — Negative stock: -5 vs min 50", `Status: ${status7}`);

  // TEST 8 — Negative minimum validation rejection
  const resNegative = productSchema.safeParse({
    name: "Steel Rod",
    sku: "ST-001",
    categoryId: "cat-123",
    uom: "KG",
    minimumStock: -10,
  });
  assert(!resNegative.success, "Test 8 — Negative minimum stock rejected by Zod schema", resNegative.success ? "Accepted" : "Rejected");

  // TEST 9 — Update product with valid minimumStock
  const resUpdate = updateProductSchema.safeParse({
    minimumStock: 75.5,
  });
  assert(resUpdate.success && resUpdate.data?.minimumStock === 75.5, "Test 9 — Valid decimal minimumStock accepted in update schema", `Parsed: ${resUpdate.data?.minimumStock}`);

  // TEST 10 — Query schema with stockStatus filter
  const resQuery = productQuerySchema.safeParse({
    stockStatus: "LOW_STOCK",
    status: "ACTIVE",
    page: 1,
    limit: 10,
  });
  assert(resQuery.success && resQuery.data?.stockStatus === "LOW_STOCK", "Test 10 — Product query schema accepts stockStatus filter", `Status: ${resQuery.data?.stockStatus}`);

  // TEST 11 — Dashboard aggregation and no double-counting invariant
  const mockProducts = [
    { id: "1", name: "Steel Ingot", minimumStock: 50, stocks: [{ quantity: 100 }] }, // IN_STOCK (100 >= 50)
    { id: "2", name: "Steel Rod", minimumStock: 50, stocks: [{ quantity: 20 }] },   // LOW_STOCK (20 < 50)
    { id: "3", name: "Chair", minimumStock: 20, stocks: [{ quantity: 0 }] },        // OUT_OF_STOCK (0)
    { id: "4", name: "Table", minimumStock: 0, stocks: [{ quantity: 10 }] },        // IN_STOCK (10 >= 0)
    { id: "5", name: "Desk Lamp", minimumStock: 15, stocks: [{ quantity: 15 }] },   // IN_STOCK (15 >= 15)
  ];

  let lowStockCount = 0;
  let outOfStockCount = 0;
  for (const p of mockProducts) {
    const totalStock = p.stocks.reduce((sum, s) => sum + s.quantity, 0);
    const status = productRepository.computeStockStatus(totalStock, p.minimumStock);
    if (status === "OUT_OF_STOCK") outOfStockCount++;
    else if (status === "LOW_STOCK") lowStockCount++;
  }
  const combined = lowStockCount + outOfStockCount;

  assert(lowStockCount === 1, "Test 11.1 — Accurate Low Stock count (Steel Rod = 1)", `Count: ${lowStockCount}`);
  assert(outOfStockCount === 1, "Test 11.2 — Accurate Out of Stock count (Chair = 1)", `Count: ${outOfStockCount}`);
  assert(combined === 2, "Test 11.3 — Combined count without double-counting (1 + 1 = 2)", `Combined: ${combined}`);

  console.log("\n=================================================");
  console.log(`🏁 UNIT TEST SUMMARY: ${passed}/${total} TESTS PASSED`);
  console.log("=================================================");

  if (passed !== total) {
    process.exit(1);
  }
}

runUnitTests();
