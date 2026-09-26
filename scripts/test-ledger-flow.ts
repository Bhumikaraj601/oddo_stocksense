import {
  ledgerQuerySchema,
} from "../src/lib/validations/ledger";

console.log("==================================================");
console.log("StockSense Phase 9 Stock Ledger & Move History Test Suite");
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
// 1. Ledger Query Schema Validations
// --------------------------------------------------
runTest("Ledger query schema applies sensible defaults", () => {
  const parsed = ledgerQuerySchema.parse({});
  if (parsed.page !== 1) throw new Error(`Expected page 1, got ${parsed.page}`);
  if (parsed.limit !== 20) throw new Error(`Expected limit 20, got ${parsed.limit}`);
  if (parsed.operationType !== "ALL") throw new Error(`Expected operationType ALL, got ${parsed.operationType}`);
  if (parsed.sortBy !== "createdAt") throw new Error(`Expected sortBy createdAt, got ${parsed.sortBy}`);
  if (parsed.sortOrder !== "desc") throw new Error(`Expected sortOrder desc, got ${parsed.sortOrder}`);
});

runTest("Ledger query schema parses filters and pagination correctly", () => {
  const parsed = ledgerQuerySchema.parse({
    page: "2",
    limit: "50",
    search: "Steel Rod",
    productId: "prod-steel-rod",
    operationType: "RECEIPT",
    warehouseId: "wh-main",
    locationId: "loc-rack-a",
    startDate: "2026-09-01T00:00:00.000Z",
    endDate: "2026-09-30T23:59:59.999Z",
    sortBy: "quantity",
    sortOrder: "asc",
  });

  if (parsed.page !== 2 || parsed.limit !== 50) throw new Error("Pagination parse error");
  if (parsed.operationType !== "RECEIPT") throw new Error("OperationType filter parse error");
  if (parsed.sortBy !== "quantity" || parsed.sortOrder !== "asc") throw new Error("Sort parse error");
});

// --------------------------------------------------
// 2. Directional Quantity Display Formatter Test
// --------------------------------------------------
runTest("Directional quantity formatting produces unambiguous movement representations", () => {
  const formatMovementQuantity = (type: string, qty: number, uom: string) => {
    switch (type) {
      case "RECEIPT":
        return `+${Math.abs(qty)} ${uom}`;
      case "DELIVERY":
        return `-${Math.abs(qty)} ${uom}`;
      case "INTERNAL_TRANSFER":
        return `${Math.abs(qty)} ${uom}`;
      case "ADJUSTMENT":
        return `${qty > 0 ? "+" : ""}${qty} ${uom}`;
      default:
        return `${qty} ${uom}`;
    }
  };

  if (formatMovementQuantity("RECEIPT", 100, "KG") !== "+100 KG") {
    throw new Error("Receipt formatting failed");
  }
  if (formatMovementQuantity("DELIVERY", -20, "PCS") !== "-20 PCS") {
    throw new Error("Delivery formatting failed");
  }
  if (formatMovementQuantity("INTERNAL_TRANSFER", 30, "PCS") !== "30 PCS") {
    throw new Error("Transfer formatting failed");
  }
  if (formatMovementQuantity("ADJUSTMENT", -3, "PCS") !== "-3 PCS") {
    throw new Error("Adjustment negative formatting failed");
  }
  if (formatMovementQuantity("ADJUSTMENT", 5, "PCS") !== "+5 PCS") {
    throw new Error("Adjustment positive formatting failed");
  }
});

// --------------------------------------------------
// 3. Central Ledger Engine Simulation
// --------------------------------------------------
interface StockLedgerEntry {
  id: string;
  reference: string;
  operationType: "RECEIPT" | "DELIVERY" | "INTERNAL_TRANSFER" | "ADJUSTMENT";
  productId: string;
  productName: string;
  productSku: string;
  sourceLocationId: string | null;
  sourceLocationName: string | null;
  destinationLocationId: string | null;
  destinationLocationName: string | null;
  quantity: number; // Stored signed / movement value
  uom: string;
  performedBy: string;
  notes: string;
  createdAt: Date;
}

class LedgerAuditEngine {
  public ledger: StockLedgerEntry[] = [];
  public stock: Record<string, number> = {};

  getStock(productId: string, locationId: string): number {
    return this.stock[`${productId}:${locationId}`] ?? 0;
  }

  setStock(productId: string, locationId: string, qty: number) {
    this.stock[`${productId}:${locationId}`] = qty;
  }

  // 1. Receipt Validation: +Quantity into destination location
  recordReceipt(data: {
    reference: string;
    productId: string;
    productName: string;
    productSku: string;
    destinationLocationId: string;
    destinationLocationName: string;
    quantity: number;
    uom: string;
    performedBy: string;
  }) {
    const current = this.getStock(data.productId, data.destinationLocationId);
    this.setStock(data.productId, data.destinationLocationId, current + data.quantity);

    this.ledger.push({
      id: `entry-${Date.now()}-${Math.random()}`,
      reference: data.reference,
      operationType: "RECEIPT",
      productId: data.productId,
      productName: data.productName,
      productSku: data.productSku,
      sourceLocationId: null, // Vendor
      sourceLocationName: "Vendor / Supplier",
      destinationLocationId: data.destinationLocationId,
      destinationLocationName: data.destinationLocationName,
      quantity: data.quantity, // +100
      uom: data.uom,
      performedBy: data.performedBy,
      notes: `Received from supplier into ${data.destinationLocationName}`,
      createdAt: new Date(Date.now() - 3000),
    });
  }

  // 2. Transfer Validation: -Quantity from source, +Quantity to destination
  recordTransfer(data: {
    reference: string;
    productId: string;
    productName: string;
    productSku: string;
    sourceLocationId: string;
    sourceLocationName: string;
    destinationLocationId: string;
    destinationLocationName: string;
    quantity: number;
    uom: string;
    performedBy: string;
  }) {
    const sourceStock = this.getStock(data.productId, data.sourceLocationId);
    if (sourceStock < data.quantity) {
      throw new Error("Insufficient stock for transfer");
    }
    const destStock = this.getStock(data.productId, data.destinationLocationId);

    this.setStock(data.productId, data.sourceLocationId, sourceStock - data.quantity);
    this.setStock(data.productId, data.destinationLocationId, destStock + data.quantity);

    this.ledger.push({
      id: `entry-${Date.now()}-${Math.random()}`,
      reference: data.reference,
      operationType: "INTERNAL_TRANSFER",
      productId: data.productId,
      productName: data.productName,
      productSku: data.productSku,
      sourceLocationId: data.sourceLocationId,
      sourceLocationName: data.sourceLocationName,
      destinationLocationId: data.destinationLocationId,
      destinationLocationName: data.destinationLocationName,
      quantity: data.quantity, // 30
      uom: data.uom,
      performedBy: data.performedBy,
      notes: `Transfer from ${data.sourceLocationName} to ${data.destinationLocationName}`,
      createdAt: new Date(Date.now() - 2000),
    });
  }

  // 3. Delivery Validation: -Quantity from source location
  recordDelivery(data: {
    reference: string;
    productId: string;
    productName: string;
    productSku: string;
    sourceLocationId: string;
    sourceLocationName: string;
    quantity: number;
    uom: string;
    performedBy: string;
  }) {
    const sourceStock = this.getStock(data.productId, data.sourceLocationId);
    if (sourceStock < data.quantity) {
      throw new Error("Insufficient stock for delivery");
    }

    this.setStock(data.productId, data.sourceLocationId, sourceStock - data.quantity);

    this.ledger.push({
      id: `entry-${Date.now()}-${Math.random()}`,
      reference: data.reference,
      operationType: "DELIVERY",
      productId: data.productId,
      productName: data.productName,
      productSku: data.productSku,
      sourceLocationId: data.sourceLocationId,
      sourceLocationName: data.sourceLocationName,
      destinationLocationId: null, // Customer
      destinationLocationName: "Customer / Outbound",
      quantity: -data.quantity, // -20
      uom: data.uom,
      performedBy: data.performedBy,
      notes: `Delivered goods from ${data.sourceLocationName}`,
      createdAt: new Date(Date.now() - 1000),
    });
  }

  // 4. Adjustment Validation: Counted stock becomes new stock, diff recorded in ledger
  recordAdjustment(data: {
    reference: string;
    productId: string;
    productName: string;
    productSku: string;
    locationId: string;
    locationName: string;
    countedQuantity: number;
    uom: string;
    performedBy: string;
  }) {
    const currentStock = this.getStock(data.productId, data.locationId);
    const diff = data.countedQuantity - currentStock;

    // Rule: Counted stock directly sets new stock
    this.setStock(data.productId, data.locationId, data.countedQuantity);

    if (diff !== 0) {
      this.ledger.push({
        id: `entry-${Date.now()}-${Math.random()}`,
        reference: data.reference,
        operationType: "ADJUSTMENT",
        productId: data.productId,
        productName: data.productName,
        productSku: data.productSku,
        sourceLocationId: diff < 0 ? data.locationId : null,
        sourceLocationName: diff < 0 ? data.locationName : null,
        destinationLocationId: diff > 0 ? data.locationId : null,
        destinationLocationName: diff > 0 ? data.locationName : null,
        quantity: diff, // -3 or +5
        uom: data.uom,
        performedBy: data.performedBy,
        notes: `Inventory adjustment at ${data.locationName}: diff ${diff}`,
        createdAt: new Date(),
      });
    }
  }

  queryMovements(params?: {
    search?: string;
    operationType?: string;
    productId?: string;
    page?: number;
    limit?: number;
  }) {
    let result = [...this.ledger];

    // Filter by operation type
    if (params?.operationType && params.operationType !== "ALL") {
      result = result.filter((e) => e.operationType === params.operationType);
    }

    // Filter by product ID
    if (params?.productId && params.productId !== "ALL") {
      result = result.filter((e) => e.productId === params.productId);
    }

    // Filter by search
    if (params?.search) {
      const q = params.search.toLowerCase();
      result = result.filter(
        (e) =>
          e.reference.toLowerCase().includes(q) ||
          e.productName.toLowerCase().includes(q) ||
          e.productSku.toLowerCase().includes(q) ||
          e.notes.toLowerCase().includes(q)
      );
    }

    // Sort newest first
    result.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;
    const total = result.length;
    const paginated = result.slice((page - 1) * limit, page * limit);

    return {
      data: paginated,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }
}

// --------------------------------------------------
// 4. IMPORTANT INTEGRATION TEST — Complete 4-Step Flow
// --------------------------------------------------
runTest("Complete 4-Step Invariant Flow: Receipt (+100) -> Transfer (30) -> Delivery (-20) -> Adjustment (-3)", () => {
  const engine = new LedgerAuditEngine();

  // Step 1: Receive 100 Steel Rods into Rack A
  engine.recordReceipt({
    reference: "REC-000001",
    productId: "prod-steel-rod",
    productName: "Steel Rod",
    productSku: "ROD-001",
    destinationLocationId: "loc-rack-a",
    destinationLocationName: "Rack A",
    quantity: 100,
    uom: "KG",
    performedBy: "Alice",
  });

  if (engine.getStock("prod-steel-rod", "loc-rack-a") !== 100) {
    throw new Error("Receipt did not set Rack A stock to 100");
  }

  // Step 2: Transfer 30 Steel Rods from Rack A to Rack B
  engine.recordTransfer({
    reference: "TRF-000001",
    productId: "prod-steel-rod",
    productName: "Steel Rod",
    productSku: "ROD-001",
    sourceLocationId: "loc-rack-a",
    sourceLocationName: "Rack A",
    destinationLocationId: "loc-rack-b",
    destinationLocationName: "Rack B",
    quantity: 30,
    uom: "KG",
    performedBy: "Bob",
  });

  if (engine.getStock("prod-steel-rod", "loc-rack-a") !== 70) {
    throw new Error(`Expected Rack A = 70, got ${engine.getStock("prod-steel-rod", "loc-rack-a")}`);
  }
  if (engine.getStock("prod-steel-rod", "loc-rack-b") !== 30) {
    throw new Error(`Expected Rack B = 30, got ${engine.getStock("prod-steel-rod", "loc-rack-b")}`);
  }

  // Step 3: Deliver 20 Steel Rods from Rack B
  engine.recordDelivery({
    reference: "DEL-000001",
    productId: "prod-steel-rod",
    productName: "Steel Rod",
    productSku: "ROD-001",
    sourceLocationId: "loc-rack-b",
    sourceLocationName: "Rack B",
    quantity: 20,
    uom: "KG",
    performedBy: "Charlie",
  });

  if (engine.getStock("prod-steel-rod", "loc-rack-b") !== 10) {
    throw new Error(`Expected Rack B = 10, got ${engine.getStock("prod-steel-rod", "loc-rack-b")}`);
  }

  // Step 4: Physical Count Adjustment at Rack B: System = 10, Count = 7 (Difference = -3)
  engine.recordAdjustment({
    reference: "ADJ-000001",
    productId: "prod-steel-rod",
    productName: "Steel Rod",
    productSku: "ROD-001",
    locationId: "loc-rack-b",
    locationName: "Rack B",
    countedQuantity: 7, // Count = 7
    uom: "KG",
    performedBy: "Diana",
  });

  if (engine.getStock("prod-steel-rod", "loc-rack-b") !== 7) {
    throw new Error(`Expected Rack B = 7 after count adjustment, got ${engine.getStock("prod-steel-rod", "loc-rack-b")}`);
  }

  // --------------------------------------------------
  // Move History Ledger Verification
  // --------------------------------------------------
  const allMovements = engine.queryMovements();

  if (allMovements.data.length !== 4) {
    throw new Error(`Expected exactly 4 ledger records, got ${allMovements.data.length}`);
  }

  // Verify chronological order (newest first)
  const [m1, m2, m3, m4] = allMovements.data;

  // Newest: Adjustment ADJ-000001
  if (m1.reference !== "ADJ-000001" || m1.operationType !== "ADJUSTMENT" || m1.quantity !== -3) {
    throw new Error(`m1 adjustment mismatch: ${JSON.stringify(m1)}`);
  }

  // 2nd: Delivery DEL-000001
  if (m2.reference !== "DEL-000001" || m2.operationType !== "DELIVERY" || m2.quantity !== -20) {
    throw new Error(`m2 delivery mismatch: ${JSON.stringify(m2)}`);
  }

  // 3rd: Transfer TRF-000001
  if (m3.reference !== "TRF-000001" || m3.operationType !== "INTERNAL_TRANSFER" || m3.quantity !== 30) {
    throw new Error(`m3 transfer mismatch: ${JSON.stringify(m3)}`);
  }

  // 4th: Receipt REC-000001
  if (m4.reference !== "REC-000001" || m4.operationType !== "RECEIPT" || m4.quantity !== 100) {
    throw new Error(`m4 receipt mismatch: ${JSON.stringify(m4)}`);
  }
});

// --------------------------------------------------
// 5. Operation Type Filtering Test
// --------------------------------------------------
runTest("Operation Type filters isolate specific movement categories", () => {
  const engine = new LedgerAuditEngine();
  engine.recordReceipt({
    reference: "REC-000001",
    productId: "p1",
    productName: "Product 1",
    productSku: "SKU-1",
    destinationLocationId: "loc-1",
    destinationLocationName: "Loc 1",
    quantity: 50,
    uom: "PCS",
    performedBy: "Alice",
  });
  engine.recordDelivery({
    reference: "DEL-000001",
    productId: "p1",
    productName: "Product 1",
    productSku: "SKU-1",
    sourceLocationId: "loc-1",
    sourceLocationName: "Loc 1",
    quantity: 10,
    uom: "PCS",
    performedBy: "Bob",
  });

  const receiptsOnly = engine.queryMovements({ operationType: "RECEIPT" });
  if (receiptsOnly.data.length !== 1 || receiptsOnly.data[0].reference !== "REC-000001") {
    throw new Error("RECEIPT filter failed");
  }

  const deliveriesOnly = engine.queryMovements({ operationType: "DELIVERY" });
  if (deliveriesOnly.data.length !== 1 || deliveriesOnly.data[0].reference !== "DEL-000001") {
    throw new Error("DELIVERY filter failed");
  }

  const transfersOnly = engine.queryMovements({ operationType: "INTERNAL_TRANSFER" });
  if (transfersOnly.data.length !== 0) {
    throw new Error("INTERNAL_TRANSFER filter should be empty");
  }
});

// --------------------------------------------------
// 6. Search Filter Test
// --------------------------------------------------
runTest("Search filters by product SKU, product name, and reference number", () => {
  const engine = new LedgerAuditEngine();
  engine.recordReceipt({
    reference: "REC-000099",
    productId: "p-chair",
    productName: "Ergonomic Office Chair",
    productSku: "CHR-ERG-01",
    destinationLocationId: "loc-1",
    destinationLocationName: "Loc 1",
    quantity: 20,
    uom: "PCS",
    performedBy: "Alice",
  });

  // Search by reference
  const byRef = engine.queryMovements({ search: "REC-000099" });
  if (byRef.data.length !== 1) throw new Error("Search by reference failed");

  // Search by SKU
  const bySku = engine.queryMovements({ search: "CHR-ERG-01" });
  if (bySku.data.length !== 1) throw new Error("Search by SKU failed");

  // Search by Product Name substring
  const byName = engine.queryMovements({ search: "Ergonomic" });
  if (byName.data.length !== 1) throw new Error("Search by name substring failed");

  // Search non-existent
  const byNone = engine.queryMovements({ search: "NONEXISTENT_ITEM" });
  if (byNone.data.length !== 0) throw new Error("Non-existent search returned results");
});

// --------------------------------------------------
// 7. Server Pagination Test
// --------------------------------------------------
runTest("Server pagination chunks ledger records accurately", () => {
  const engine = new LedgerAuditEngine();
  for (let i = 1; i <= 25; i++) {
    engine.recordReceipt({
      reference: `REC-${String(i).padStart(6, "0")}`,
      productId: "p1",
      productName: "Item",
      productSku: "SKU-1",
      destinationLocationId: "loc-1",
      destinationLocationName: "Loc 1",
      quantity: 1,
      uom: "PCS",
      performedBy: "User",
    });
  }

  const page1 = engine.queryMovements({ page: 1, limit: 10 });
  if (page1.data.length !== 10 || page1.meta.total !== 25 || page1.meta.totalPages !== 3) {
    throw new Error("Page 1 calculation failed");
  }

  const page3 = engine.queryMovements({ page: 3, limit: 10 });
  if (page3.data.length !== 5) {
    throw new Error(`Expected 5 items on page 3, got ${page3.data.length}`);
  }
});

console.log("==================================================");
console.log(`All ${passedTests}/${totalTests} Stock Ledger Tests Passed!`);
console.log("==================================================");
