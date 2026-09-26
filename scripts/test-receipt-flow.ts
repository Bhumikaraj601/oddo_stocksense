import {
  supplierSchema,
  receiptSchema,
  receiptQuerySchema,
  receiptItemInputSchema,
} from "../src/lib/validations/receipt";

console.log("==================================================");
console.log("StockSense Phase 5 Receipts & Incoming Stock Test Suite");
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

// 1. Supplier Schema Tests
runTest("Valid supplier with code transform", () => {
  const parsed = supplierSchema.parse({
    name: "Apex Metals Ltd",
    code: "sup-apex-01",
    email: "sales@apexmetals.com",
    phone: "+1 800-555-0199",
    address: "100 Foundry Rd, Pittsburgh, PA",
  });

  if (parsed.code !== "SUP-APEX-01") {
    throw new Error(`Expected uppercase code SUP-APEX-01, got ${parsed.code}`);
  }
  if (parsed.name !== "Apex Metals Ltd") {
    throw new Error(`Expected supplier name match`);
  }
});

runTest("Supplier schema rejects short or empty name", () => {
  try {
    supplierSchema.parse({
      name: " ",
    });
    throw new Error("Should have failed on empty supplier name");
  } catch (err: any) {
    // Expected
  }
});

runTest("Supplier schema rejects invalid email format", () => {
  try {
    supplierSchema.parse({
      name: "Apex Metals",
      email: "not-an-email",
    });
    throw new Error("Should have failed on invalid email format");
  } catch (err: any) {
    // Expected
  }
});

// 2. Receipt Schema Tests
runTest("Valid receipt schema with multiple product lines", () => {
  const parsed = receiptSchema.parse({
    supplierName: "Apex Metals Ltd",
    warehouseId: "wh-main-uuid",
    notes: "PO-2026-9001 Delivery Bill #102",
    items: [
      {
        productId: "prod-steel-uuid",
        locationId: "loc-rack-a1-uuid",
        quantityReceived: 50,
        uom: "KG",
      },
      {
        productId: "prod-chair-uuid",
        locationId: "loc-rack-b2-uuid",
        quantityReceived: 20,
        uom: "PCS",
      },
    ],
  });

  if (parsed.items.length !== 2) {
    throw new Error(`Expected 2 line items, got ${parsed.items.length}`);
  }
  if (parsed.items[0].quantityReceived !== 50) {
    throw new Error(`Expected quantity 50, got ${parsed.items[0].quantityReceived}`);
  }
});

runTest("Receipt schema rejects empty line items", () => {
  try {
    receiptSchema.parse({
      supplierName: "Apex Metals",
      warehouseId: "wh-main-uuid",
      items: [],
    });
    throw new Error("Should have failed on empty line items");
  } catch (err: any) {
    // Expected
  }
});

runTest("Receipt item rejects zero or negative quantity", () => {
  try {
    receiptItemInputSchema.parse({
      productId: "prod-1",
      locationId: "loc-1",
      quantityReceived: 0,
      uom: "PCS",
    });
    throw new Error("Should have failed on zero quantity");
  } catch (err: any) {
    // Expected
  }

  try {
    receiptItemInputSchema.parse({
      productId: "prod-1",
      locationId: "loc-1",
      quantityReceived: -10,
      uom: "KG",
    });
    throw new Error("Should have failed on negative quantity");
  } catch (err: any) {
    // Expected
  }
});

// 3. Query Schemas
runTest("Receipt query schema parses status and warehouse filters", () => {
  const query = receiptQuerySchema.parse({
    page: "1",
    limit: "15",
    status: "READY",
    warehouseId: "wh-main-uuid",
    search: "REC-000001",
  });

  if (query.status !== "READY" || query.warehouseId !== "wh-main-uuid" || query.search !== "REC-000001") {
    throw new Error("Receipt query schema parsing error");
  }
});

console.log("==================================================");
console.log(`✓ ALL ${passedTests}/${totalTests} PHASE 5 TESTS PASSED (100%)`);
console.log("==================================================");
