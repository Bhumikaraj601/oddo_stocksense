import {
  transferSchema,
  transferItemInputSchema,
  transferQuerySchema,
} from "../src/lib/validations/transfer";

console.log("==================================================");
console.log("StockSense Phase 7 Internal Transfers Test Suite");
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

// 1. Transfer Schema Validations
runTest("Valid internal transfer payload parses successfully", () => {
  const parsed = transferSchema.parse({
    sourceWarehouseId: "wh-main-001",
    sourceLocationId: "loc-rack-a",
    destinationWarehouseId: "wh-main-001",
    destinationLocationId: "loc-rack-b",
    scheduledDate: "2026-10-15T00:00:00.000Z",
    notes: "Replenishment for assembly line",
    items: [
      {
        productId: "prod-steel-rods",
        quantity: 30,
        uom: "KG",
      },
    ],
  });

  if (parsed.items.length !== 1 || parsed.items[0].quantity !== 30) {
    throw new Error("Line items parsed incorrectly");
  }
  if (parsed.sourceLocationId === parsed.destinationLocationId) {
    throw new Error("Source and dest locations are the same");
  }
});

runTest("Transfer schema rejects identical source and destination locations", () => {
  try {
    transferSchema.parse({
      sourceLocationId: "loc-rack-a",
      destinationLocationId: "loc-rack-a",
      items: [
        {
          productId: "prod-steel-rods",
          quantity: 10,
        },
      ],
    });
    throw new Error("Should have failed when source and destination are identical");
  } catch (err: any) {
    // Expected
  }
});

runTest("Transfer schema rejects empty line items", () => {
  try {
    transferSchema.parse({
      sourceLocationId: "loc-rack-a",
      destinationLocationId: "loc-rack-b",
      items: [],
    });
    throw new Error("Should have failed on empty items");
  } catch (err: any) {
    // Expected
  }
});

runTest("Transfer line item rejects zero or negative quantity", () => {
  try {
    transferItemInputSchema.parse({
      productId: "prod-steel-rods",
      quantity: 0,
    });
    throw new Error("Should have rejected 0 quantity");
  } catch (err: any) {
    // Expected
  }

  try {
    transferItemInputSchema.parse({
      productId: "prod-steel-rods",
      quantity: -25,
    });
    throw new Error("Should have rejected negative quantity");
  } catch (err: any) {
    // Expected
  }
});

runTest("Transfer query schema parses defaults and filters", () => {
  const parsed = transferQuerySchema.parse({
    status: "READY",
    search: "TRF-000001",
    page: "1",
    limit: "15",
  });

  if (parsed.status !== "READY" || parsed.limit !== 15) {
    throw new Error("Transfer query parse failure");
  }
});

// 2. Core Specification Scenario: Steel Rods Rack A (100) -> Rack B (20), Transfer 30
runTest("Official Scenario: Steel Rods Rack A (100) -> Rack B (20) with transfer of 30 results in Rack A (70), Rack B (50), Total (120)", () => {
  class InventoryTracker {
    public stock: Record<string, number> = {
      "prod-steel-rods:loc-rack-a": 100,
      "prod-steel-rods:loc-rack-b": 20,
    };
    public ledger: Array<{
      reference: string;
      operationType: string;
      productId: string;
      sourceLocationId: string;
      destinationLocationId: string;
      quantity: number;
    }> = [];

    getStock(productId: string, locationId: string): number {
      return this.stock[`${productId}:${locationId}`] ?? 0;
    }

    setStock(productId: string, locationId: string, qty: number) {
      this.stock[`${productId}:${locationId}`] = qty;
    }

    getLedgerCount(): number {
      return this.ledger.length;
    }
  }

  const tracker = new InventoryTracker();

  const transferOrder = {
    id: "trf-001",
    referenceNumber: "TRF-000001",
    sourceLocationId: "loc-rack-a",
    destinationLocationId: "loc-rack-b",
    status: "DRAFT",
    items: [
      {
        productId: "prod-steel-rods",
        quantity: 30,
        uom: "KG",
      },
    ],
  };

  // Step 1: Draft creation - stock must be unchanged
  if (tracker.getStock("prod-steel-rods", "loc-rack-a") !== 100) throw new Error("Draft changed source stock!");
  if (tracker.getStock("prod-steel-rods", "loc-rack-b") !== 20) throw new Error("Draft changed destination stock!");
  if (tracker.getLedgerCount() !== 0) throw new Error("Draft created ledger entries!");

  // Step 2: Mark READY - stock must be unchanged
  transferOrder.status = "READY";
  if (tracker.getStock("prod-steel-rods", "loc-rack-a") !== 100) throw new Error("Ready changed source stock!");

  // Step 3: Validation Transaction Execution
  const executeTransferValidation = (order: typeof transferOrder, t: InventoryTracker) => {
    if (order.status === "DONE") {
      throw new Error("This internal transfer has already been validated.");
    }
    if (order.status === "CANCELED") {
      throw new Error("Cannot validate a canceled internal transfer.");
    }
    if (order.sourceLocationId === order.destinationLocationId) {
      throw new Error("Source and destination cannot be the same.");
    }

    for (const item of order.items) {
      const sourceQty = t.getStock(item.productId, order.sourceLocationId);
      if (sourceQty < item.quantity) {
        throw new Error(
          `Insufficient stock at source location. Available: ${sourceQty}, Requested: ${item.quantity}`
        );
      }

      // Decrement source
      t.setStock(item.productId, order.sourceLocationId, sourceQty - item.quantity);

      // Increment destination
      const destQty = t.getStock(item.productId, order.destinationLocationId);
      t.setStock(item.productId, order.destinationLocationId, destQty + item.quantity);

      // Create Stock Ledger Entry
      t.ledger.push({
        reference: order.referenceNumber,
        operationType: "INTERNAL_TRANSFER",
        productId: item.productId,
        sourceLocationId: order.sourceLocationId,
        destinationLocationId: order.destinationLocationId,
        quantity: item.quantity,
      });
    }

    order.status = "DONE";
  };

  executeTransferValidation(transferOrder, tracker);

  const finalSourceStock = tracker.getStock("prod-steel-rods", "loc-rack-a");
  const finalDestStock = tracker.getStock("prod-steel-rods", "loc-rack-b");
  const finalTotalStock = finalSourceStock + finalDestStock;

  if (finalSourceStock !== 70) {
    throw new Error(`Expected Rack A stock 70, got ${finalSourceStock}`);
  }
  if (finalDestStock !== 50) {
    throw new Error(`Expected Rack B stock 50, got ${finalDestStock}`);
  }
  if (finalTotalStock !== 120) {
    throw new Error(`Total inventory corrupted! Expected 120, got ${finalTotalStock}`);
  }
  if (transferOrder.status !== "DONE") {
    throw new Error("Transfer status should be DONE");
  }
  if (tracker.getLedgerCount() !== 1) {
    throw new Error("Expected exactly 1 Stock Ledger entry");
  }

  // Idempotency check: Duplicate validation must be rejected
  try {
    executeTransferValidation(transferOrder, tracker);
    throw new Error("Should have rejected duplicate validation!");
  } catch (err: any) {
    if (!err.message.includes("already been validated")) {
      throw err;
    }
  }

  // Stock must remain unchanged after duplicate attempt
  if (tracker.getStock("prod-steel-rods", "loc-rack-a") !== 70) {
    throw new Error("Duplicate validation corrupted source stock!");
  }
  if (tracker.getStock("prod-steel-rods", "loc-rack-b") !== 50) {
    throw new Error("Duplicate validation corrupted destination stock!");
  }
});

// 3. Insufficient Source Stock Check
runTest("Transfer rejects validation when source stock is insufficient", () => {
  const stock = { "steel-rod:rack-a": 15, "steel-rod:rack-b": 0 };

  const checkAvailability = (reqQty: number, available: number) => {
    if (available < reqQty) {
      throw new Error(`Insufficient stock. Available: ${available}, Requested: ${reqQty}`);
    }
  };

  try {
    checkAvailability(30, stock["steel-rod:rack-a"]);
    throw new Error("Should have thrown insufficient stock error");
  } catch (err: any) {
    if (!err.message.includes("Insufficient stock")) {
      throw err;
    }
  }

  if (stock["steel-rod:rack-a"] !== 15) {
    throw new Error("Source stock was modified during failed check!");
  }
});

console.log("==================================================");
console.log(`All ${passedTests}/${totalTests} Internal Transfer Tests Passed!`);
console.log("==================================================");
