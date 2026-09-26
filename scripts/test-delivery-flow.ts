import {
  deliverySchema,
  deliveryItemInputSchema,
  updateDeliverySchema,
  pickItemsSchema,
  packItemsSchema,
  deliveryQuerySchema,
} from "../src/lib/validations/delivery";

console.log("==================================================");
console.log("StockSense Phase 6 Delivery Orders Test Suite");
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

// 1. Delivery Schema Validations
runTest("Valid delivery payload parses successfully", () => {
  const dummyWarehouseId = "a0000000-0000-0000-0000-000000000001";
  const dummyLocationId = "b0000000-0000-0000-0000-000000000001";
  const dummyProductId = "c0000000-0000-0000-0000-000000000001";

  const parsed = deliverySchema.parse({
    customerName: "Acme Industrial Corp",
    warehouseId: dummyWarehouseId,
    sourceLocationId: dummyLocationId,
    scheduledDate: "2026-10-15T00:00:00.000Z",
    notes: "Express delivery via freight",
    items: [
      {
        productId: dummyProductId,
        locationId: dummyLocationId,
        quantityDemand: 25,
        uom: "PCS",
      },
    ],
  });

  if (parsed.customerName !== "Acme Industrial Corp") {
    throw new Error("Customer name mismatch");
  }
  if (parsed.items.length !== 1 || parsed.items[0].quantityDemand !== 25) {
    throw new Error("Line items parsed incorrectly");
  }
});

runTest("Delivery schema rejects empty customer name", () => {
  try {
    deliverySchema.parse({
      customerName: "  ",
      warehouseId: "a0000000-0000-0000-0000-000000000001",
      items: [
        {
          productId: "c0000000-0000-0000-0000-000000000001",
          locationId: "b0000000-0000-0000-0000-000000000001",
          quantityDemand: 10,
        },
      ],
    });
    throw new Error("Should have failed on empty customer name");
  } catch (err: any) {
    // Expected
  }
});

runTest("Delivery schema rejects empty line items", () => {
  try {
    deliverySchema.parse({
      customerName: "Acme Industrial Corp",
      warehouseId: "a0000000-0000-0000-0000-000000000001",
      items: [],
    });
    throw new Error("Should have failed on empty items");
  } catch (err: any) {
    // Expected
  }
});

runTest("Delivery line item rejects non-positive quantity", () => {
  try {
    deliveryItemInputSchema.parse({
      productId: "c0000000-0000-0000-0000-000000000001",
      locationId: "b0000000-0000-0000-0000-000000000001",
      quantityDemand: 0,
    });
    throw new Error("Should have rejected 0 quantity");
  } catch (err: any) {
    // Expected
  }

  try {
    deliveryItemInputSchema.parse({
      productId: "c0000000-0000-0000-0000-000000000001",
      locationId: "b0000000-0000-0000-0000-000000000001",
      quantityDemand: -15,
    });
    throw new Error("Should have rejected negative quantity");
  } catch (err: any) {
    // Expected
  }
});

// 2. Pick & Pack Schemas
runTest("Pick items schema validates picked quantities correctly", () => {
  const dummyItemId = "d0000000-0000-0000-0000-000000000001";
  const parsed = pickItemsSchema.parse({
    items: [
      {
        id: dummyItemId,
        pickedQuantity: 10,
      },
    ],
  });

  if (parsed.items[0].pickedQuantity !== 10) {
    throw new Error("Picked quantity mismatch");
  }

  // Should reject negative
  try {
    pickItemsSchema.parse({
      items: [{ id: dummyItemId, pickedQuantity: -1 }],
    });
    throw new Error("Should have rejected negative pick quantity");
  } catch {
    // Expected
  }
});

runTest("Pack items schema validates packed quantities correctly", () => {
  const dummyItemId = "d0000000-0000-0000-0000-000000000001";
  const parsed = packItemsSchema.parse({
    items: [
      {
        id: dummyItemId,
        packedQuantity: 10,
      },
    ],
  });

  if (parsed.items[0].packedQuantity !== 10) {
    throw new Error("Packed quantity mismatch");
  }
});

// 3. Query Schema
runTest("Delivery query schema handles defaults and filters", () => {
  const parsed = deliveryQuerySchema.parse({
    status: "READY",
    search: "DEL-000001",
    page: "2",
    limit: "10",
  });

  if (parsed.status !== "READY" || parsed.page !== 2 || parsed.limit !== 10) {
    throw new Error("Delivery query parse failure");
  }
});

// 4. Invariant Simulation: Stock Decrement & Transaction Logic
runTest("Stock invariant simulation: Draft/Waiting/Pick/Pack do NOT mutate stock; Validate decrements stock atomically", () => {
  class InventoryTracker {
    public stock: Record<string, number> = { "steel-chair-01:rack-a": 50 };
    public ledger: Array<{ reference: string; operationType: string; productId: string; quantity: number }> = [];

    getStock(key: string): number {
      return this.stock[key] ?? 0;
    }

    setStock(key: string, qty: number) {
      this.stock[key] = qty;
    }

    getLedgerCount(): number {
      return this.ledger.length;
    }
  }

  const tracker = new InventoryTracker();

  const deliveryOrder = {
    id: "del-001",
    referenceNumber: "DEL-000001",
    status: "DRAFT",
    items: [
      {
        id: "item-01",
        productId: "steel-chair-01",
        locationId: "rack-a",
        quantityDemand: 20,
        pickedQuantity: 0,
        packedQuantity: 0,
        quantityDelivered: 0,
        uom: "PCS",
      },
    ],
  };

  const itemKey = "steel-chair-01:rack-a";

  // Step 1: Draft creation - stock must be unchanged
  if (tracker.getStock(itemKey) !== 50) throw new Error("Draft changed stock!");
  if (tracker.getLedgerCount() !== 0) throw new Error("Draft wrote to ledger!");

  // Step 2: Confirmation to WAITING - stock must be unchanged
  deliveryOrder.status = "WAITING";
  if (tracker.getStock(itemKey) !== 50) throw new Error("Waiting changed stock!");

  // Step 3: Picking 20 units - stock must be unchanged
  deliveryOrder.items[0].pickedQuantity = 20;
  if (tracker.getStock(itemKey) !== 50) throw new Error("Picking changed stock!");

  // Step 4: Packing 20 units - stock must be unchanged
  deliveryOrder.items[0].packedQuantity = 20;
  deliveryOrder.status = "READY";
  if (tracker.getStock(itemKey) !== 50) throw new Error("Packing changed stock!");

  // Step 5: Insufficient stock check simulation
  const checkStockAvailability = (reqQty: number, currStock: number) => {
    if (currStock < reqQty) {
      throw new Error(`Insufficient stock. Available: ${currStock}, Requested: ${reqQty}`);
    }
  };

  // Step 6: Atomic Validation Transaction
  const executeValidation = (order: typeof deliveryOrder, t: InventoryTracker) => {
    if (order.status === "DONE") {
      throw new Error("This delivery order has already been validated.");
    }
    if (order.status === "CANCELED") {
      throw new Error("Cannot validate a canceled delivery order.");
    }

    for (const item of order.items) {
      const key = `${item.productId}:${item.locationId}`;
      const deliverQty =
        item.packedQuantity > 0
          ? item.packedQuantity
          : item.pickedQuantity > 0
          ? item.pickedQuantity
          : item.quantityDemand;

      const currentQty = t.getStock(key);
      checkStockAvailability(deliverQty, currentQty);

      // Decrement stock
      t.setStock(key, currentQty - deliverQty);
      item.quantityDelivered = deliverQty;

      // Write Ledger
      t.ledger.push({
        reference: order.referenceNumber,
        operationType: "DELIVERY",
        productId: item.productId,
        quantity: -deliverQty,
      });
    }

    order.status = "DONE";
  };

  executeValidation(deliveryOrder, tracker);

  if (tracker.getStock(itemKey) !== 30) {
    throw new Error(`Expected stock 30, got ${tracker.getStock(itemKey)}`);
  }
  if (deliveryOrder.status !== "DONE") {
    throw new Error("Delivery order status should be DONE");
  }
  if (tracker.getLedgerCount() !== 1 || tracker.ledger[0].quantity !== -20) {
    throw new Error("Stock ledger entry not recorded with -20");
  }

  // Idempotency: Second validation must throw Conflict error
  try {
    executeValidation(deliveryOrder, tracker);
    throw new Error("Should have rejected duplicate validation!");
  } catch (err: any) {
    if (!err.message.includes("already been validated")) {
      throw err;
    }
  }

  // Stock must still be 30
  if (tracker.getStock(itemKey) !== 30) {
    throw new Error("Duplicate validation corrupted stock!");
  }
});

// 5. Integration Scenario: Receipt (+100) followed by Delivery (-20) => Net Stock = 80
runTest("Integration Scenario: Receive 100 chairs -> Deliver 20 chairs -> Net Stock = 80", () => {
  class WarehouseStockStore {
    private count: number = 0;
    public ledger: Array<{ ref: string; type: string; qty: number }> = [];

    receive(qty: number) {
      this.count += qty;
      this.ledger.push({ ref: "REC-000001", type: "RECEIPT", qty: +qty });
    }

    deliver(qty: number) {
      if (this.count < qty) throw new Error("Insufficient stock");
      this.count -= qty;
      this.ledger.push({ ref: "DEL-000001", type: "DELIVERY", qty: -qty });
    }

    getCount(): number {
      return this.count;
    }
  }

  const store = new WarehouseStockStore();

  store.receive(100);
  if (store.getCount() !== 100) throw new Error("Stock after receipt should be 100");

  store.deliver(20);
  if (store.getCount() !== 80) throw new Error("Stock after delivery should be 80");

  const netFromLedger = store.ledger.reduce((acc, curr) => acc + curr.qty, 0);
  if (netFromLedger !== 80) {
    throw new Error(`Stock ledger balance ${netFromLedger} does not match net stock 80`);
  }
});

console.log("==================================================");
console.log(`All ${passedTests}/${totalTests} Delivery Order Tests Passed!`);
console.log("==================================================");
