import { PrismaClient } from "@prisma/client";
import { productService } from "../src/services/product.service";
import { dashboardService } from "../src/services/dashboard.service";
import { deliveryService } from "../src/services/delivery.service";
import { transferService } from "../src/services/transfer.service";
import { adjustmentService } from "../src/services/adjustment.service";
import { productSchema } from "../src/lib/validations/product";

const prisma = new PrismaClient();

async function runLowStockTests() {
  console.log("=================================================");
  console.log("🧪 PHASE 11: LOW STOCK ALERTS & REORDERING RULES TESTS");
  console.log("=================================================\n");

  let passedTests = 0;
  let totalTests = 10;

  try {
    // 0. Setup test prerequisites (User, Category, Warehouse, Locations)
    let testUser = await prisma.user.findFirst({ where: { email: "manager@stocksense.test" } });
    if (!testUser) {
      testUser = await prisma.user.create({
        data: {
          name: "Test Manager",
          email: "manager@stocksense.test",
          passwordHash: "hash",
          role: "INVENTORY_MANAGER",
        },
      });
    }

    let testCat = await prisma.category.findFirst({ where: { name: "Test Raw Materials" } });
    if (!testCat) {
      testCat = await prisma.category.create({
        data: { name: "Test Raw Materials", description: "Category for Low Stock Tests" },
      });
    }

    let testWh = await prisma.warehouse.findFirst({ where: { code: "WH-TEST-LS" } });
    if (!testWh) {
      testWh = await prisma.warehouse.create({
        data: { name: "Low Stock Test Warehouse", code: "WH-TEST-LS", address: "Test Zone" },
      });
    }

    let locA = await prisma.location.findFirst({ where: { code: "LOC-TEST-LSA" } });
    if (!locA) {
      locA = await prisma.location.create({
        data: { name: "Rack A", code: "LOC-TEST-LSA", warehouseId: testWh.id, type: "INTERNAL" },
      });
    }

    let locB = await prisma.location.findFirst({ where: { code: "LOC-TEST-LSB" } });
    if (!locB) {
      locB = await prisma.location.create({
        data: { name: "Rack B", code: "LOC-TEST-LSB", warehouseId: testWh.id, type: "INTERNAL" },
      });
    }

    // TEST 1 — Normal stock (Current = 100, Minimum = 50 -> Expected: IN STOCK)
    console.log("Test 1 — Normal stock (Current = 100, Minimum = 50)");
    const sku1 = `TEST-P11-T1-${Date.now()}`;
    const p1 = await productService.createProduct({
      name: "Normal Stock Steel Rod",
      sku: sku1,
      categoryId: testCat.id,
      uom: "KG",
      minimumStock: 50,
      initialStock: { locationId: locA.id, quantity: 100 },
    });
    const retrieved1 = await productService.getProductById(p1.id);
    if (retrieved1.totalStock === 100 && retrieved1.stockStatus === "IN_STOCK") {
      console.log(`✅ Passed: Current stock = ${retrieved1.totalStock}, Minimum = ${retrieved1.minimumStock}, Status = ${retrieved1.stockStatus}\n`);
      passedTests++;
    } else {
      console.error(`❌ Failed: Expected IN_STOCK but got ${retrieved1.stockStatus} (Stock: ${retrieved1.totalStock})`);
    }

    // TEST 2 — Low stock (Current = 40, Minimum = 50 -> Expected: LOW STOCK)
    console.log("Test 2 — Low stock (Current = 40, Minimum = 50)");
    const sku2 = `TEST-P11-T2-${Date.now()}`;
    const p2 = await productService.createProduct({
      name: "Low Stock Steel Rod",
      sku: sku2,
      categoryId: testCat.id,
      uom: "KG",
      minimumStock: 50,
      initialStock: { locationId: locA.id, quantity: 40 },
    });
    const retrieved2 = await productService.getProductById(p2.id);
    if (retrieved2.totalStock === 40 && retrieved2.stockStatus === "LOW_STOCK") {
      console.log(`✅ Passed: Current stock = ${retrieved2.totalStock}, Minimum = ${retrieved2.minimumStock}, Status = ${retrieved2.stockStatus}\n`);
      passedTests++;
    } else {
      console.error(`❌ Failed: Expected LOW_STOCK but got ${retrieved2.stockStatus}`);
    }

    // TEST 3 — Exactly minimum (Current = 50, Minimum = 50 -> Expected: IN STOCK)
    console.log("Test 3 — Exactly minimum (Current = 50, Minimum = 50)");
    const sku3 = `TEST-P11-T3-${Date.now()}`;
    const p3 = await productService.createProduct({
      name: "Exact Minimum Stock Bar",
      sku: sku3,
      categoryId: testCat.id,
      uom: "KG",
      minimumStock: 50,
      initialStock: { locationId: locA.id, quantity: 50 },
    });
    const retrieved3 = await productService.getProductById(p3.id);
    if (retrieved3.totalStock === 50 && retrieved3.stockStatus === "IN_STOCK") {
      console.log(`✅ Passed: Current stock = ${retrieved3.totalStock}, Minimum = ${retrieved3.minimumStock}, Status = ${retrieved3.stockStatus}\n`);
      passedTests++;
    } else {
      console.error(`❌ Failed: Expected IN_STOCK but got ${retrieved3.stockStatus}`);
    }

    // TEST 4 — Out of stock (Current = 0, Minimum = 50 -> Expected: OUT OF STOCK)
    console.log("Test 4 — Out of stock (Current = 0, Minimum = 50)");
    const sku4 = `TEST-P11-T4-${Date.now()}`;
    const p4 = await productService.createProduct({
      name: "Out of Stock Chair",
      sku: sku4,
      categoryId: testCat.id,
      uom: "PCS",
      minimumStock: 50,
    });
    const retrieved4 = await productService.getProductById(p4.id);
    if (retrieved4.totalStock === 0 && retrieved4.stockStatus === "OUT_OF_STOCK") {
      console.log(`✅ Passed: Current stock = ${retrieved4.totalStock}, Minimum = ${retrieved4.minimumStock}, Status = ${retrieved4.stockStatus}\n`);
      passedTests++;
    } else {
      console.error(`❌ Failed: Expected OUT_OF_STOCK but got ${retrieved4.stockStatus}`);
    }

    // TEST 5 — Minimum = 0 (Current = 10, Minimum = 0 -> Expected: IN STOCK)
    console.log("Test 5 — Minimum = 0 (Current = 10, Minimum = 0)");
    const sku5 = `TEST-P11-T5-${Date.now()}`;
    const p5 = await productService.createProduct({
      name: "Zero Minimum Item",
      sku: sku5,
      categoryId: testCat.id,
      uom: "PCS",
      minimumStock: 0,
      initialStock: { locationId: locA.id, quantity: 10 },
    });
    const retrieved5 = await productService.getProductById(p5.id);
    if (retrieved5.totalStock === 10 && retrieved5.stockStatus === "IN_STOCK") {
      console.log(`✅ Passed: Current stock = ${retrieved5.totalStock}, Minimum = ${retrieved5.minimumStock}, Status = ${retrieved5.stockStatus} (Not falsely marked as low stock)\n`);
      passedTests++;
    } else {
      console.error(`❌ Failed: Expected IN_STOCK but got ${retrieved5.stockStatus}`);
    }

    // TEST 6 — Negative minimum (Minimum = -10 -> Expected: Reject validation)
    console.log("Test 6 — Negative minimum (Minimum = -10 -> Validation Rejection)");
    const validationResult = productSchema.safeParse({
      name: "Invalid Negative Min Product",
      sku: "TEST-NEG-MIN",
      categoryId: testCat.id,
      uom: "PCS",
      minimumStock: -10,
    });
    if (!validationResult.success) {
      console.log(`✅ Passed: Negative minimum stock properly rejected with error: ${validationResult.error.issues[0].message}\n`);
      passedTests++;
    } else {
      console.error("❌ Failed: Negative minimum stock was unexpectedly allowed!");
    }

    // TEST 7 — Inventory flow (Start: 60, Min: 50 -> Deliver 20 -> Stock: 40 -> Status: LOW STOCK)
    console.log("Test 7 — Inventory flow: Start = 60, Min = 50, Deliver 20 -> Status: LOW STOCK");
    const sku7 = `TEST-P11-T7-${Date.now()}`;
    const p7 = await productService.createProduct({
      name: "Delivery Flow Material",
      sku: sku7,
      categoryId: testCat.id,
      uom: "KG",
      minimumStock: 50,
      initialStock: { locationId: locA.id, quantity: 60 },
    });

    const initProduct7 = await productService.getProductById(p7.id);
    console.log(`   Initial stock: ${initProduct7.totalStock} -> Status: ${initProduct7.stockStatus}`);

    // Create & Validate Delivery of 20 units
    const delivery = await deliveryService.createDelivery({
      customerName: "Acme Industrial Client",
      warehouseId: testWh.id,
      sourceLocationId: locA.id,
      items: [{ productId: p7.id, locationId: locA.id, quantityDemand: 20, uom: "KG" }],
      notes: "Phase 11 inventory depletion test",
    }, testUser.id);

    await deliveryService.validateDelivery(delivery.id, testUser.id);

    const afterDelivery7 = await productService.getProductById(p7.id);
    if (afterDelivery7.totalStock === 40 && afterDelivery7.stockStatus === "LOW_STOCK") {
      console.log(`✅ Passed: Stock decreased to ${afterDelivery7.totalStock} (Min: ${afterDelivery7.minimumStock}) -> Status transitioned to ${afterDelivery7.stockStatus}\n`);
      passedTests++;
    } else {
      console.error(`❌ Failed: Expected stock 40 and LOW_STOCK but got ${afterDelivery7.totalStock}, ${afterDelivery7.stockStatus}`);
    }

    // TEST 8 — Transfer (Move stock between locations -> Total product stock unchanged -> Status invariant)
    console.log("Test 8 — Internal transfer between locations (Total product stock remains unchanged)");
    const sku8 = `TEST-P11-T8-${Date.now()}`;
    const p8 = await productService.createProduct({
      name: "Relocation Steel Beam",
      sku: sku8,
      categoryId: testCat.id,
      uom: "PCS",
      minimumStock: 50,
      initialStock: { locationId: locA.id, quantity: 70 },
    });

    // Transfer 30 units from locA -> locB
    const transfer = await transferService.createTransfer({
      sourceWarehouseId: testWh.id,
      sourceLocationId: locA.id,
      destinationWarehouseId: testWh.id,
      destinationLocationId: locB.id,
      items: [{ productId: p8.id, quantity: 30, uom: "PCS" }],
      notes: "Phase 11 internal transfer relocation",
    }, testUser.id);

    await transferService.validateTransfer(transfer.id, testUser.id);

    const afterTransfer8 = await productService.getProductById(p8.id);
    if (afterTransfer8.totalStock === 70 && afterTransfer8.stockStatus === "IN_STOCK") {
      console.log(`✅ Passed: Total stock remained ${afterTransfer8.totalStock} (Loc A: 40, Loc B: 30) -> Status remained ${afterTransfer8.stockStatus}\n`);
      passedTests++;
    } else {
      console.error(`❌ Failed: Expected total stock 70 and IN_STOCK, got ${afterTransfer8.totalStock}, ${afterTransfer8.stockStatus}`);
    }

    // TEST 9 — Adjustment (Stock: 40, Min: 50 -> Adjust to: 70 -> Expected: IN STOCK)
    console.log("Test 9 — Stock adjustment (Stock: 40, Min: 50 -> Adjust to 70 -> Expected: IN STOCK)");
    const sku9 = `TEST-P11-T9-${Date.now()}`;
    const p9 = await productService.createProduct({
      name: "Audit Adjusted Goods",
      sku: sku9,
      categoryId: testCat.id,
      uom: "KG",
      minimumStock: 50,
      initialStock: { locationId: locA.id, quantity: 40 },
    });

    const beforeAdj9 = await productService.getProductById(p9.id);
    console.log(`   Before adjustment: Stock = ${beforeAdj9.totalStock} -> Status = ${beforeAdj9.stockStatus}`);

    const adjustment = await adjustmentService.createAdjustment({
      locationId: locA.id,
      warehouseId: testWh.id,
      reason: "Physical Cycle Count Increase",
      items: [{ productId: p9.id, countedQty: 70, theoreticalQty: 40, uom: "KG" }],
    }, testUser.id);

    await adjustmentService.validateAdjustment(adjustment.id, testUser.id);

    const afterAdj9 = await productService.getProductById(p9.id);
    if (afterAdj9.totalStock === 70 && afterAdj9.stockStatus === "IN_STOCK") {
      console.log(`✅ Passed: Stock increased to ${afterAdj9.totalStock} (Min: ${afterAdj9.minimumStock}) -> Status transitioned to ${afterAdj9.stockStatus}\n`);
      passedTests++;
    } else {
      console.error(`❌ Failed: Expected stock 70 and IN_STOCK, got ${afterAdj9.totalStock}, ${afterAdj9.stockStatus}`);
    }

    // TEST 10 — Dashboard KPI integration (Verify Low/Out of Stock count matches actual distinct products)
    console.log("Test 10 — Dashboard KPI integration (Verify Low/Out of Stock count matches actual DB products)");
    const dashboardKpis = await dashboardService.getDashboardKPIs();
    const lowStockStats = await productService.getLowStockStats();
    const lowStockProducts = await productService.getLowStockProducts();

    const expectedCombined = lowStockStats.lowStockCount + lowStockStats.outOfStockCount;

    if (
      dashboardKpis.lowStockCount === lowStockStats.lowStockCount &&
      dashboardKpis.outOfStockCount === lowStockStats.outOfStockCount &&
      lowStockProducts.length === expectedCombined
    ) {
      console.log(`✅ Passed: Dashboard accurately reflects Low Stock (${dashboardKpis.lowStockCount}), Out of Stock (${dashboardKpis.outOfStockCount}), Total Distinct Alerts = ${lowStockProducts.length}\n`);
      passedTests++;
    } else {
      console.error(`❌ Failed: Dashboard KPI count mismatch. Dashboard: (${dashboardKpis.lowStockCount}, ${dashboardKpis.outOfStockCount}), Stats: (${lowStockStats.lowStockCount}, ${lowStockStats.outOfStockCount}), Products: ${lowStockProducts.length}`);
    }

    console.log("=================================================");
    console.log(`🏁 TEST RESULTS: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log("=================================================");

    if (passedTests === totalTests) {
      console.log("🎉 ALL PHASE 11 REQUIREMENTS FULLY VERIFIED & PASSING!");
    } else {
      process.exit(1);
    }
  } catch (err) {
    console.error("❌ Exception during Phase 11 test run:", err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runLowStockTests();
