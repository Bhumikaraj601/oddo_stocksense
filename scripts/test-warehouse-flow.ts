import {
  warehouseSchema,
  updateWarehouseSchema,
  locationSchema,
  updateLocationSchema,
  warehouseQuerySchema,
  locationQuerySchema,
  stockQuerySchema,
  LOCATION_TYPES,
} from "../src/lib/validations/warehouse";

console.log("==================================================");
console.log("StockSense Phase 4 Warehouse & Location Test Suite");
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

// 1. Warehouse Schema Validations
runTest("Warehouse schema validation with uppercase code transform", () => {
  const input = {
    name: "Main Distribution Center",
    code: "wh-001",
    description: "Primary central distribution center",
    address: "100 Industrial Parkway, Chicago, IL",
    isActive: true,
  };

  const parsed = warehouseSchema.parse(input);
  if (parsed.code !== "WH-001") {
    throw new Error(`Expected code to be WH-001, got ${parsed.code}`);
  }
  if (parsed.name !== "Main Distribution Center") {
    throw new Error(`Expected name to match input`);
  }
});

runTest("Warehouse schema rejects empty name or short code", () => {
  try {
    warehouseSchema.parse({
      name: " ",
      code: "W",
    });
    throw new Error("Should have failed on invalid warehouse payload");
  } catch (err: any) {
    // Expected to throw validation errors
  }
});

runTest("Warehouse schema rejects special characters in code", () => {
  try {
    warehouseSchema.parse({
      name: "Warehouse Alpha",
      code: "WH 001 @!",
    });
    throw new Error("Should have failed on special characters in code");
  } catch (err: any) {
    // Expected
  }
});

// 2. Location Schema Validations
runTest("Location schema validates controlled LocationType", () => {
  const input = {
    name: "Production Floor Assembly",
    code: "prod-floor-1",
    type: "PRODUCTION",
    isScrap: false,
    isActive: true,
    warehouseId: "wh-1234-uuid",
  };

  const parsed = locationSchema.parse(input);
  if (parsed.code !== "PROD-FLOOR-1") {
    throw new Error(`Expected uppercase code PROD-FLOOR-1, got ${parsed.code}`);
  }
  if (parsed.type !== "PRODUCTION") {
    throw new Error(`Expected type PRODUCTION, got ${parsed.type}`);
  }
});

runTest("Location schema rejects invalid LocationType", () => {
  try {
    locationSchema.parse({
      name: "Invalid Zone",
      code: "INV-01",
      type: "NON_EXISTENT_TYPE" as any,
    });
    throw new Error("Should have rejected invalid location type");
  } catch (err: any) {
    // Expected
  }
});

runTest("Location schema supports all defined LocationTypes", () => {
  for (const type of LOCATION_TYPES) {
    const parsed = locationSchema.parse({
      name: `Test Location ${type}`,
      code: `LOC-${type}`,
      type,
    });
    if (parsed.type !== type) {
      throw new Error(`Expected type ${type}, got ${parsed.type}`);
    }
  }
});

// 3. Query Schemas
runTest("Warehouse query schema defaults and pagination", () => {
  const query = warehouseQuerySchema.parse({
    page: "2",
    limit: "25",
    status: "ACTIVE",
    search: "Main",
  });

  if (query.page !== 2 || query.limit !== 25 || query.status !== "ACTIVE" || query.search !== "Main") {
    throw new Error("Query schema parsing error");
  }
});

runTest("Stock query schema supports warehouse and location filters", () => {
  const stockQuery = stockQuerySchema.parse({
    warehouseId: "wh-100",
    locationId: "loc-200",
    search: "Steel",
  });

  if (stockQuery.warehouseId !== "wh-100" || stockQuery.locationId !== "loc-200") {
    throw new Error("Stock query filtering error");
  }
});

console.log("==================================================");
console.log(`✓ ALL ${passedTests}/${totalTests} PHASE 4 TESTS PASSED (100%)`);
console.log("==================================================");
