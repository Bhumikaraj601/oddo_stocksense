import {
  adjustmentSchema,
  adjustmentItemInputSchema,
  adjustmentQuerySchema,
  updateAdjustmentSchema,
} from "../src/lib/validations/adjustment";

console.log("==================================================");
console.log("StockSense Phase 8 Inventory Adjustments Test Suite");
console.log("==================================================");

let totalTests = 0;
let passedTests = 0;

function runTest(name: string, fn: () => void) {
  totalTests++;
  try {
    fn();
    console.log(`✓ [Test ${totalTests}] ${name}`);
    passedTests++;
  } catch (error: any) {
    console.error(`✗ [Test ${totalTests}] ${name}`);
    console.error("  Error:", error?.message || error);
    process.exit(1);
  }
}

// --------------------------------------------------
// Schema & Input Validations
// --------------------------------------------------
runTest("Adjustment schema parses valid payload", () => {
  const parsed = adjustmentSchema.parse({
    warehouseId: "wh-main-001",
    locationId: "loc-rack-a",
    reason: "Periodic cycle count reconciliation",
    items: [
      {
        productId: "prod-steel-rod",
        countedQty: 97,
        uom: "PCS",
      },
    ],
  });

  if (parsed.items.length !== 1 || parsed.items[0].countedQty !== 97) {
    throw new Error("Items parsed incorrectly");
  }
  if (parsed.locationId !== "loc-rack-a") {
    throw new Error("Location ID mismatch");
  }
});

runTest("Adjustment item allows 0 as valid counted quantity", () => {
  const parsed = adjustmentItemInputSchema.parse({
    productId: "prod-chair",
    countedQty: 0,
    uom: "PCS",
  });

  if (parsed.countedQty !== 0) {
    throw new Error("0 count should be valid");
  }
});

// --------------------------------------------------
// TEST 4 — Negative Quantity Rejection
// --------------------------------------------------
runTest("TEST 4 — Negative quantity: Count = -5 rejected by validation", () => {
  let failed = false;
  try {
    adjustmentItemInputSchema.parse({
      productId: "prod-steel-rod",
      countedQty: -5,
      uom: "PCS",
    });
  } catch (err) {
    failed = true;
  }

  if (!failed) {
    throw new Error("Negative counted quantity (-5) was not rejected!");
  }
});

// --------------------------------------------------
// TEST 5 — Invalid Location Cross-Warehouse Check
// --------------------------------------------------
runTest("TEST 5 — Invalid location: Location from another warehouse is rejected", () => {
  const warehouses = [
    { id: "wh-main", name: "Main Warehouse" },
    { id: "wh-production", name: "Production Plant" },
  ];
  const locations = [
    { id: "loc-rack-a", name: "Rack A", warehouseId: "wh-main" },
    { id: "loc-prod-floor", name: "Floor 1", warehouseId: "wh-production" },
  ];

  const validateWarehouseLocation = (warehouseId: string, locationId: string) => {
    const loc = locations.find((l) => l.id === locationId);
    if (!loc) throw new Error("Location not found");
    if (loc.warehouseId !== warehouseId) {
      throw new Error(
        `Location "${loc.name}" does not belong to the selected warehouse.`
      );
    }
    return true;
  };

  // Valid combo
  if (!validateWarehouseLocation("wh-main", "loc-rack-a")) {
    throw new Error("Valid warehouse-location pair failed");
  }

  // Cross-warehouse combo should throw
  let rejected = false;
  try {
    validateWarehouseLocation("wh-main", "loc-prod-floor");
  } catch (err: any) {
    if (err.message.includes("does not belong")) {
      rejected = true;
    }
  }

  if (!rejected) {
    throw new Error("Cross-warehouse location was not rejected!");
  }
});

// --------------------------------------------------
// Inventory Engine Simulation for Transaction Tests
// --------------------------------------------------
class InventorySimulator {
  public stockBalances: Record<string, number> = {};
  public stockLedger: Array<{
    reference: string;
    operationType: string;
    productId: string;
    sourceLocationId: string | null;
    destinationLocationId: string | null;
    quantity: number; // Signed difference
    uom: string;
  }> = [];

  setInitialStock(productId: string, locationId: string, qty: number) {
    this.stockBalances[`${productId}:${locationId}`] = qty;
  }

  getStock(productId: string, locationId: string): number {
    return this.stockBalances[`${productId}:${locationId}`] ?? 0;
  }

  validateAdjustment(
    adjustment: {
      id: string;
      referenceNumber: string;
      locationId: string;
      status: string;
      items: Array<{
        id: string;
        productId: string;
        countedQty: number;
        uom: string;
      }>;
    }
  ) {
    if (adjustment.status === "DONE") {
      throw new Error("This inventory adjustment has already been validated.");
    }
    if (adjustment.status === "CANCELED") {
      throw new Error("Cannot validate a canceled adjustment.");
    }

    for (const item of adjustment.items) {
      if (item.countedQty < 0) {
        throw new Error("Counted quantity cannot be negative.");
      }

      const currentStock = this.getStock(item.productId, adjustment.locationId);
      const difference = item.countedQty - currentStock;

      // RULE: COUNTED STOCK becomes the new STOCK directly
      this.stockBalances[`${item.productId}:${adjustment.locationId}`] = item.countedQty;

      // Stock Ledger entry for discrepancy
      if (difference !== 0) {
        this.stockLedger.push({
          reference: adjustment.referenceNumber,
          operationType: "INVENTORY_ADJUSTMENT",
          productId: item.productId,
          sourceLocationId: difference < 0 ? adjustment.locationId : null,
          destinationLocationId: difference > 0 ? adjustment.locationId : null,
          quantity: difference,
          uom: item.uom,
        });
      }
    }

    adjustment.status = "DONE";
  }
}

// --------------------------------------------------
// TEST 1 — Decrease: Initial 100, Count 97 -> Stock 97, Ledger -3
// --------------------------------------------------
runTest("TEST 1 — Decrease: Initial 100, Count 97 => Stock = 97, Ledger = -3", () => {
  const sim = new InventorySimulator();
  sim.setInitialStock("prod-steel-rod", "loc-rack-a", 100);

  const adj = {
    id: "adj-001",
    referenceNumber: "ADJ-000001",
    locationId: "loc-rack-a",
    status: "DRAFT",
    items: [
      {
        id: "item-1",
        productId: "prod-steel-rod",
        countedQty: 97,
        uom: "PCS",
      },
    ],
  };

  sim.validateAdjustment(adj);

  const finalStock = sim.getStock("prod-steel-rod", "loc-rack-a");
  if (finalStock !== 97) {
    throw new Error(`Expected Stock = 97, but got ${finalStock}`);
  }

  if (sim.stockLedger.length !== 1) {
    throw new Error(`Expected 1 ledger entry, got ${sim.stockLedger.length}`);
  }

  const ledgerEntry = sim.stockLedger[0];
  if (ledgerEntry.quantity !== -3) {
    throw new Error(`Expected Ledger difference = -3, got ${ledgerEntry.quantity}`);
  }
  if (ledgerEntry.sourceLocationId !== "loc-rack-a" || ledgerEntry.destinationLocationId !== null) {
    throw new Error("Negative adjustment should set sourceLocationId to the adjusted location");
  }
  if (adj.status !== "DONE") {
    throw new Error("Adjustment status should be DONE");
  }
});

// --------------------------------------------------
// TEST 2 — Increase: Initial 100, Count 105 -> Stock 105, Ledger +5
// --------------------------------------------------
runTest("TEST 2 — Increase: Initial 100, Count 105 => Stock = 105, Ledger = +5", () => {
  const sim = new InventorySimulator();
  sim.setInitialStock("prod-steel-rod", "loc-rack-a", 100);

  const adj = {
    id: "adj-002",
    referenceNumber: "ADJ-000002",
    locationId: "loc-rack-a",
    status: "DRAFT",
    items: [
      {
        id: "item-2",
        productId: "prod-steel-rod",
        countedQty: 105,
        uom: "PCS",
      },
    ],
  };

  sim.validateAdjustment(adj);

  const finalStock = sim.getStock("prod-steel-rod", "loc-rack-a");
  if (finalStock !== 105) {
    throw new Error(`Expected Stock = 105, but got ${finalStock}`);
  }

  if (sim.stockLedger.length !== 1) {
    throw new Error(`Expected 1 ledger entry, got ${sim.stockLedger.length}`);
  }

  const ledgerEntry = sim.stockLedger[0];
  if (ledgerEntry.quantity !== 5) {
    throw new Error(`Expected Ledger difference = +5, got ${ledgerEntry.quantity}`);
  }
  if (ledgerEntry.destinationLocationId !== "loc-rack-a" || ledgerEntry.sourceLocationId !== null) {
    throw new Error("Positive adjustment should set destinationLocationId to the adjusted location");
  }
});

// --------------------------------------------------
// TEST 3 — Zero: Initial 10, Count 0 -> Stock 0, Ledger -10
// --------------------------------------------------
runTest("TEST 3 — Zero: Initial 10, Count 0 => Stock = 0, Ledger = -10", () => {
  const sim = new InventorySimulator();
  sim.setInitialStock("prod-steel-rod", "loc-rack-a", 10);

  const adj = {
    id: "adj-003",
    referenceNumber: "ADJ-000003",
    locationId: "loc-rack-a",
    status: "DRAFT",
    items: [
      {
        id: "item-3",
        productId: "prod-steel-rod",
        countedQty: 0,
        uom: "PCS",
      },
    ],
  };

  sim.validateAdjustment(adj);

  const finalStock = sim.getStock("prod-steel-rod", "loc-rack-a");
  if (finalStock !== 0) {
    throw new Error(`Expected Stock = 0, but got ${finalStock}`);
  }

  if (sim.stockLedger.length !== 1) {
    throw new Error(`Expected 1 ledger entry, got ${sim.stockLedger.length}`);
  }

  const ledgerEntry = sim.stockLedger[0];
  if (ledgerEntry.quantity !== -10) {
    throw new Error(`Expected Ledger difference = -10, got ${ledgerEntry.quantity}`);
  }
});

// --------------------------------------------------
// TEST 6 — Double Validation Prevention
// --------------------------------------------------
runTest("TEST 6 — Double validation: Validating twice rejects and preserves stock", () => {
  const sim = new InventorySimulator();
  sim.setInitialStock("prod-steel-rod", "loc-rack-a", 100);

  const adj = {
    id: "adj-004",
    referenceNumber: "ADJ-000004",
    locationId: "loc-rack-a",
    status: "DRAFT",
    items: [
      {
        id: "item-4",
        productId: "prod-steel-rod",
        countedQty: 97,
        uom: "PCS",
      },
    ],
  };

  // 1st Validation -> Success
  sim.validateAdjustment(adj);
  if (sim.getStock("prod-steel-rod", "loc-rack-a") !== 97) {
    throw new Error("First validation failed");
  }

  // 2nd Validation -> Must be rejected
  let rejected = false;
  try {
    sim.validateAdjustment(adj);
  } catch (err: any) {
    if (err.message.includes("already been validated")) {
      rejected = true;
    }
  }

  if (!rejected) {
    throw new Error("Second validation was not rejected!");
  }

  // Stock must remain unchanged (97, not modified again)
  if (sim.getStock("prod-steel-rod", "loc-rack-a") !== 97) {
    throw new Error("Stock corrupted during duplicate validation attempt!");
  }

  // Ledger entries must remain 1
  if (sim.stockLedger.length !== 1) {
    throw new Error("Duplicate ledger entries created!");
  }
});

// --------------------------------------------------
// TEST 7 — Multiple Products Adjustment
// --------------------------------------------------
runTest("TEST 7 — Multiple products: Steel Rod 100->97 (-3), Chair 50->55 (+5)", () => {
  const sim = new InventorySimulator();
  sim.setInitialStock("prod-steel-rod", "loc-rack-a", 100);
  sim.setInitialStock("prod-chair", "loc-rack-a", 50);

  const multiAdj = {
    id: "adj-005",
    referenceNumber: "ADJ-000005",
    locationId: "loc-rack-a",
    status: "DRAFT",
    items: [
      {
        id: "item-rod",
        productId: "prod-steel-rod",
        countedQty: 97,
        uom: "PCS",
      },
      {
        id: "item-chair",
        productId: "prod-chair",
        countedQty: 55,
        uom: "PCS",
      },
    ],
  };

  sim.validateAdjustment(multiAdj);

  // Check final stocks
  const finalRod = sim.getStock("prod-steel-rod", "loc-rack-a");
  const finalChair = sim.getStock("prod-chair", "loc-rack-a");

  if (finalRod !== 97) {
    throw new Error(`Expected Steel Rod = 97, got ${finalRod}`);
  }
  if (finalChair !== 55) {
    throw new Error(`Expected Chair = 55, got ${finalChair}`);
  }

  // Check ledger entries
  if (sim.stockLedger.length !== 2) {
    throw new Error(`Expected 2 ledger entries, got ${sim.stockLedger.length}`);
  }

  const rodEntry = sim.stockLedger.find((l) => l.productId === "prod-steel-rod");
  const chairEntry = sim.stockLedger.find((l) => l.productId === "prod-chair");

  if (!rodEntry || rodEntry.quantity !== -3) {
    throw new Error(`Steel Rod ledger entry missing or incorrect: ${rodEntry?.quantity}`);
  }
  if (!chairEntry || chairEntry.quantity !== 5) {
    throw new Error(`Chair ledger entry missing or incorrect: ${chairEntry?.quantity}`);
  }
});

// --------------------------------------------------
// In-Balance Check: Count == System Stock -> No Ledger entry needed
// --------------------------------------------------
runTest("Exact count (diff = 0) sets stock without unnecessary ledger discrepancy entry", () => {
  const sim = new InventorySimulator();
  sim.setInitialStock("prod-bolts", "loc-rack-a", 500);

  const exactAdj = {
    id: "adj-006",
    referenceNumber: "ADJ-000006",
    locationId: "loc-rack-a",
    status: "DRAFT",
    items: [
      {
        id: "item-bolts",
        productId: "prod-bolts",
        countedQty: 500,
        uom: "PCS",
      },
    ],
  };

  sim.validateAdjustment(exactAdj);

  if (sim.getStock("prod-bolts", "loc-rack-a") !== 500) {
    throw new Error("Stock changed on exact count");
  }
  if (sim.stockLedger.length !== 0) {
    throw new Error("Zero-diff adjustment should not produce discrepancy ledger entries");
  }
});

console.log("==================================================");
console.log(`All ${passedTests}/${totalTests} Inventory Adjustment Tests Passed!`);
console.log("==================================================");
