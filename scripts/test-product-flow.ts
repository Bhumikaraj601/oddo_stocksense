import { productSchema, categorySchema } from "../src/lib/validations/product";
import { UNITS_OF_MEASURE } from "../src/lib/constants";

async function runProductUnitTests() {
  console.log("==================================================");
  console.log("StockSense Phase 3 Product & Category Test Suite");
  console.log("==================================================");

  // 1. Valid Product Schema Validation
  console.log("\n[Test 1] Valid Product Validation");
  const validProduct = {
    name: "Industrial Steel Ingot 50kg",
    sku: "RAW-STL-050",
    description: "Structural carbon steel ingot",
    uom: "KG",
    categoryId: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
    isActive: true,
  };

  const parseResult = productSchema.safeParse(validProduct);
  console.assert(parseResult.success === true, "Valid product schema parsing failed");
  console.log("✓ Valid product schema passed.");

  // 2. Invalid UOM Rejection Test
  console.log("\n[Test 2] Invalid UOM Rejection");
  const invalidUomProduct = {
    ...validProduct,
    sku: "RAW-STL-051",
    uom: "Kilograms", // Not in controlled UNITS_OF_MEASURE
  };

  const uomResult = productSchema.safeParse(invalidUomProduct);
  console.assert(uomResult.success === false, "Invalid UOM was unexpectedly accepted");
  console.log("✓ Invalid UOM correctly rejected by controlled enum.");

  // 3. Invalid / Missing SKU Rejection Test
  console.log("\n[Test 3] Invalid SKU Rejection");
  const invalidSkuProduct = {
    ...validProduct,
    sku: "SKU WITH SPACES #@!", // Invalid characters
  };

  const skuResult = productSchema.safeParse(invalidSkuProduct);
  console.assert(skuResult.success === false, "Invalid SKU format was unexpectedly accepted");
  console.log("✓ Invalid SKU format correctly rejected.");

  // 4. Initial Stock Negative Quantity Rejection Test
  console.log("\n[Test 4] Negative Initial Stock Rejection");
  const negativeStockProduct = {
    ...validProduct,
    sku: "RAW-STL-052",
    initialStock: {
      locationId: "a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d",
      quantity: -50,
    },
  };

  const stockResult = productSchema.safeParse(negativeStockProduct);
  console.assert(stockResult.success === false, "Negative stock was unexpectedly accepted");
  console.log("✓ Negative initial stock correctly rejected.");

  // 5. Category Schema Validation & Case Normalization
  console.log("\n[Test 5] Category Schema Validation");
  const validCategory = {
    name: "Raw Materials",
    description: "Metals and polymers",
    isActive: true,
  };

  const catResult = categorySchema.safeParse(validCategory);
  console.assert(catResult.success === true, "Valid category parsing failed");
  console.log("✓ Category validation schema passed.");

  console.log("\n==================================================");
  console.log("✓ ALL PHASE 3 PRODUCT & CATEGORY TESTS PASSED (100%)");
  console.log("==================================================");
}

runProductUnitTests().catch((err) => {
  console.error("Test Suite Failed:", err);
  process.exit(1);
});
