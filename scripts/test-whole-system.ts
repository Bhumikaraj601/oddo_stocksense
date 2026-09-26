import prisma from "../src/lib/prisma";
import { authService } from "../src/services/auth.service";
import { productService } from "../src/services/product.service";
import { warehouseService } from "../src/services/warehouse.service";
import { locationService } from "../src/services/location.service";
import { receiptService } from "../src/services/receipt.service";
import { transferService } from "../src/services/transfer.service";
import { deliveryService } from "../src/services/delivery.service";
import { adjustmentService } from "../src/services/adjustment.service";
import { ledgerService } from "../src/services/ledger.service";
import { dashboardService } from "../src/services/dashboard.service";
import { OperationStatus } from "@prisma/client";

async function runWholeSystemTest() {
  console.log("======================================================================");
  console.log("🚀 STOCKSENSE — WHOLE SYSTEM REAL POSTGRESQL E2E TEST SUITE");
  console.log("======================================================================\n");

  let totalTests = 0;
  let passedTests = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`✅ [PASS] ${testName}${detail ? ` — ${detail}` : ""}`);
    } else {
      console.error(`❌ [FAIL] ${testName}${detail ? ` — ${detail}` : ""}`);
    }
  }

  try {
    // ======================================================================
    // 1. AUTHENTICATION TESTING
    // ======================================================================
    console.log("\n--- SECTION 1: AUTHENTICATION & USER MANAGEMENT ---");
    const testEmail = `test.manager.${Date.now()}@stocksense.io`;
    const testPassword = "Password@123";

    // 1.1 Valid Signup
    const userResult = await authService.signup({
      name: "Test Manager",
      email: testEmail,
      password: testPassword,
      confirmPassword: testPassword,
      role: "INVENTORY_MANAGER",
    });
    const userId = userResult.user.id;
    assert(!!userId && userResult.user.email === testEmail, "Valid user registration", `ID: ${userId}`);

    // 1.2 Duplicate Email Rejection
    let duplicateRejected = false;
    try {
      await authService.signup({
        name: "Duplicate User",
        email: testEmail,
        password: testPassword,
        confirmPassword: testPassword,
        role: "WAREHOUSE_STAFF",
      });
    } catch (e: any) {
      duplicateRejected = true;
    }
    assert(duplicateRejected, "Duplicate email registration rejected");

    // 1.3 Invalid/Weak Password Rejection
    let weakPassRejected = false;
    try {
      await authService.signup({
        name: "Weak Pass User",
        email: `weak.${Date.now()}@stocksense.io`,
        password: "123",
        confirmPassword: "123",
        role: "WAREHOUSE_STAFF",
      });
    } catch (e: any) {
      weakPassRejected = true;
    }
    assert(weakPassRejected, "Weak password (<6 chars) rejected");

    // 1.4 Correct Login
    const loginRes = await authService.login({
      email: testEmail,
      password: testPassword,
    });
    assert(!!loginRes?.user && !!loginRes.token, "Login with valid credentials", `Token generated`);

    // 1.5 Wrong Password Rejection
    let wrongPassRejected = false;
    try {
      await authService.login({
        email: testEmail,
        password: "WrongPassword123!",
      });
    } catch (e: any) {
      wrongPassRejected = true;
    }
    assert(wrongPassRejected, "Login with wrong password rejected");

    // 1.6 Non-existent Account Rejection
    let nonExistentRejected = false;
    try {
      await authService.login({
        email: "non.existent.user.404@stocksense.io",
        password: testPassword,
      });
    } catch (e: any) {
      nonExistentRejected = true;
    }
    assert(nonExistentRejected, "Login with non-existent email rejected");

    // User ID is ready for operations

    // ======================================================================
    // 2. PRODUCT & CATEGORY TESTING
    // ======================================================================
    console.log("\n--- SECTION 2: PRODUCT CATALOG & CATEGORIES ---");

    // 2.1 Category creation / lookup
    let category = await prisma.category.findFirst({
      where: { name: "Raw Material" },
    });
    if (!category) {
      category = await prisma.category.create({
        data: {
          name: "Raw Material",
          description: "Raw manufacturing metals and polymers",
        },
      });
    }
    assert(!!category, "Category 'Raw Material' verified", `Cat ID: ${category.id}`);

    // 2.2 Product creation: Steel Rod (ST-001)
    const testSku = `ST-${Date.now().toString().slice(-4)}`;
    const product = await productService.createProduct({
      name: "Steel Rod",
      sku: testSku,
      categoryId: category.id,
      uom: "KG",
      minimumStock: 50,
      description: "High-grade industrial steel rod 20mm",
    });
    assert(!!product && product.sku === testSku && product.minimumStock === 50, "Product 'Steel Rod' created", `SKU: ${product.sku}, Min: ${product.minimumStock}`);

    // 2.3 Duplicate SKU Rejection
    let duplicateSkuRejected = false;
    try {
      await productService.createProduct({
        name: "Steel Rod Duplicate",
        sku: testSku,
        categoryId: category.id,
        uom: "KG",
        minimumStock: 20,
      });
    } catch (e: any) {
      duplicateSkuRejected = true;
    }
    assert(duplicateSkuRejected, "Duplicate product SKU rejected by validation");

    // 2.4 Negative Minimum Stock Rejection
    let negativeMinRejected = false;
    try {
      await productService.createProduct({
        name: "Invalid Min Product",
        sku: `NEG-${Date.now().toString().slice(-4)}`,
        categoryId: category.id,
        uom: "PCS",
        minimumStock: -10,
      });
    } catch (e: any) {
      negativeMinRejected = true;
    }
    assert(negativeMinRejected, "Negative minimum stock rejected");

    // ======================================================================
    // 3. WAREHOUSE & LOCATION TESTING
    // ======================================================================
    console.log("\n--- SECTION 3: WAREHOUSES & STORAGE LOCATIONS ---");

    // Find or create Main Warehouse
    let warehouse = await prisma.warehouse.findFirst({
      where: { name: "Main Warehouse" },
    });
    if (!warehouse) {
      const whCode = `MWH-${Date.now().toString().slice(-3)}`;
      warehouse = await warehouseService.createWarehouse({
        name: "Main Warehouse",
        code: whCode,
        description: "Primary distribution and storage hub",
        address: "100 Logistics Blvd, Industrial Zone",
        isActive: true,
      });
    }
    assert(!!warehouse, "Warehouse 'Main Warehouse' verified", `Code: ${warehouse.code}`);

    let locRackA = await prisma.location.findFirst({
      where: { warehouseId: warehouse.id, code: "RACK-A" },
    });
    if (!locRackA) {
      locRackA = await locationService.createLocation({
        name: "Rack A",
        code: "RACK-A",
        warehouseId: warehouse.id,
        type: "INTERNAL",
        description: "Zone 1 - Rack A",
        isScrap: false,
        isActive: true,
      });
    }
    assert(!!locRackA && locRackA.name === "Rack A", "Location 'Rack A' verified", `Location ID: ${locRackA.id}`);

    let locRackB = await prisma.location.findFirst({
      where: { warehouseId: warehouse.id, code: "RACK-B" },
    });
    if (!locRackB) {
      locRackB = await locationService.createLocation({
        name: "Rack B",
        code: "RACK-B",
        warehouseId: warehouse.id,
        type: "INTERNAL",
        description: "Zone 1 - Rack B",
        isScrap: false,
        isActive: true,
      });
    }
    assert(!!locRackB && locRackB.name === "Rack B", "Location 'Rack B' verified", `Location ID: ${locRackB.id}`);

    // ======================================================================
    // 4. RECEIPT FLOW (+100 KG at Rack A)
    // ======================================================================
    console.log("\n--- SECTION 4: INCOMING GOODS RECEIPT (+100 KG) ---");

    const receipt = await receiptService.createReceipt(
      {
        supplierName: "Apex Steel Global",
        warehouseId: warehouse.id,
        destinationLocationId: locRackA.id,
        items: [
          {
            productId: product.id,
            locationId: locRackA.id,
            quantityReceived: 100,
            uom: "KG",
          },
        ],
      },
      userId
    );
    assert(!!receipt && receipt.status === OperationStatus.DRAFT, "Receipt draft created", `Ref: ${receipt.referenceNumber}`);

    // Validate Receipt
    const validatedReceipt = await receiptService.validateReceipt(receipt.id, userId);
    assert(validatedReceipt.status === OperationStatus.DONE, "Receipt validated successfully", `Status: DONE`);

    // Verify Stock at Rack A
    const stockRackAAfterRec = await prisma.stock.findUnique({
      where: {
        productId_locationId: { productId: product.id, locationId: locRackA.id },
      },
    });
    assert(stockRackAAfterRec?.quantity === 100, "Stock at Rack A = 100 KG", `Actual: ${stockRackAAfterRec?.quantity}`);

    // Verify Double Validation Prevention
    let doubleRecValRejected = false;
    try {
      await receiptService.validateReceipt(receipt.id, userId);
    } catch (e: any) {
      doubleRecValRejected = true;
    }
    assert(doubleRecValRejected, "Receipt double validation rejected (idempotent guard)");

    // ======================================================================
    // 5. INTERNAL TRANSFER FLOW (30 KG: Rack A -> Rack B)
    // ======================================================================
    console.log("\n--- SECTION 5: INTERNAL TRANSFER (30 KG: Rack A -> Rack B) ---");

    const transfer = await transferService.createTransfer(
      {
        sourceWarehouseId: warehouse.id,
        destinationWarehouseId: warehouse.id,
        sourceLocationId: locRackA.id,
        destinationLocationId: locRackB.id,
        items: [
          {
            productId: product.id,
            quantity: 30,
            uom: "KG",
          },
        ],
      },
      userId
    );
    assert(!!transfer && transfer.status === OperationStatus.DRAFT, "Transfer draft created", `Ref: ${transfer.referenceNumber}`);

    // Validate Transfer
    const validatedTransfer = await transferService.validateTransfer(transfer.id, userId);
    assert(validatedTransfer.status === OperationStatus.DONE, "Transfer validated successfully");

    // Verify Stock: Rack A = 70, Rack B = 30, Total = 100
    const stockAAfterTrf = await prisma.stock.findUnique({
      where: { productId_locationId: { productId: product.id, locationId: locRackA.id } },
    });
    const stockBAfterTrf = await prisma.stock.findUnique({
      where: { productId_locationId: { productId: product.id, locationId: locRackB.id } },
    });
    const totalAfterTrf = (stockAAfterTrf?.quantity || 0) + (stockBAfterTrf?.quantity || 0);

    assert(stockAAfterTrf?.quantity === 70, "Stock at Rack A = 70 KG", `Actual: ${stockAAfterTrf?.quantity}`);
    assert(stockBAfterTrf?.quantity === 30, "Stock at Rack B = 30 KG", `Actual: ${stockBAfterTrf?.quantity}`);
    assert(totalAfterTrf === 100, "Total Inventory invariant preserved (100 KG)", `Total: ${totalAfterTrf}`);

    // Negative test: Over-transfer rejection (> 70 available)
    let overTransferRejected = false;
    try {
      const badTrf = await transferService.createTransfer(
        {
          sourceWarehouseId: warehouse.id,
          destinationWarehouseId: warehouse.id,
          sourceLocationId: locRackA.id,
          destinationLocationId: locRackB.id,
          items: [{ productId: product.id, quantity: 500, uom: "KG" }],
        },
        userId
      );
      await transferService.validateTransfer(badTrf.id, userId);
    } catch (e: any) {
      overTransferRejected = true;
    }
    assert(overTransferRejected, "Over-transfer (> source available stock) rejected");

    // ======================================================================
    // 6. DELIVERY ORDER FLOW (-20 KG from Rack B)
    // ======================================================================
    console.log("\n--- SECTION 6: OUTGOING DELIVERY ORDER (-20 KG from Rack B) ---");

    const delivery = await deliveryService.createDelivery(
      {
        customerName: "Nordic Construction Ltd",
        warehouseId: warehouse.id,
        sourceLocationId: locRackB.id,
        items: [
          {
            productId: product.id,
            locationId: locRackB.id,
            quantityDemand: 20,
            uom: "KG",
          },
        ],
      },
      userId
    );
    assert(!!delivery && delivery.status === OperationStatus.DRAFT, "Delivery draft created", `Ref: ${delivery.referenceNumber}`);

    // Validate Delivery
    const validatedDelivery = await deliveryService.validateDelivery(delivery.id, userId);
    assert(validatedDelivery.status === OperationStatus.DONE, "Delivery validated & dispatched");

    // Verify Stock: Rack B = 10, Total = 80
    const stockBAfterDel = await prisma.stock.findUnique({
      where: { productId_locationId: { productId: product.id, locationId: locRackB.id } },
    });
    const totalAfterDel = (stockAAfterTrf?.quantity || 0) + (stockBAfterDel?.quantity || 0);

    assert(stockBAfterDel?.quantity === 10, "Stock at Rack B = 10 KG", `Actual: ${stockBAfterDel?.quantity}`);
    assert(totalAfterDel === 80, "Total Inventory = 80 KG", `Total: ${totalAfterDel}`);

    // ======================================================================
    // 7. INVENTORY ADJUSTMENT FLOW (Count 7 at Rack B -> Delta -3)
    // ======================================================================
    console.log("\n--- SECTION 7: INVENTORY ADJUSTMENTS ---");

    // 7.1 Adjustment 1: Rack B (10 -> 7, delta -3)
    const adj1 = await adjustmentService.createAdjustment(
      {
        locationId: locRackB.id,
        reason: "Cycle count discrepancy - minor scrap",
        items: [
          {
            productId: product.id,
            theoreticalQty: 10,
            countedQty: 7,
            uom: "KG",
          },
        ],
      },
      userId
    );
    const validatedAdj1 = await adjustmentService.validateAdjustment(adj1.id, userId);
    assert(validatedAdj1.status === OperationStatus.DONE, "Adjustment 1 validated (10 -> 7)");

    const stockBAfterAdj1 = await prisma.stock.findUnique({
      where: { productId_locationId: { productId: product.id, locationId: locRackB.id } },
    });
    const totalAfterAdj1 = (stockAAfterTrf?.quantity || 0) + (stockBAfterAdj1?.quantity || 0);
    assert(stockBAfterAdj1?.quantity === 7, "Stock at Rack B adjusted to 7 KG", `Actual: ${stockBAfterAdj1?.quantity}`);
    assert(totalAfterAdj1 === 77, "Total Inventory = 77 KG (70 + 7)", `Actual: ${totalAfterAdj1}`);

    // 7.2 Adjustment 2: Increase Rack B (7 -> 12, delta +5)
    const adj2 = await adjustmentService.createAdjustment(
      {
        locationId: locRackB.id,
        reason: "Unrecorded return added to Rack B",
        items: [
          {
            productId: product.id,
            theoreticalQty: 7,
            countedQty: 12,
            uom: "KG",
          },
        ],
      },
      userId
    );
    const validatedAdj2 = await adjustmentService.validateAdjustment(adj2.id, userId);
    assert(validatedAdj2.status === OperationStatus.DONE, "Adjustment 2 validated (7 -> 12)");

    const stockBAfterAdj2 = await prisma.stock.findUnique({
      where: { productId_locationId: { productId: product.id, locationId: locRackB.id } },
    });
    const totalAfterAdj2 = (stockAAfterTrf?.quantity || 0) + (stockBAfterAdj2?.quantity || 0);
    assert(stockBAfterAdj2?.quantity === 12, "Stock at Rack B adjusted to 12 KG", `Actual: ${stockBAfterAdj2?.quantity}`);
    assert(totalAfterAdj2 === 82, "Total Inventory = 82 KG (70 + 12)", `Actual: ${totalAfterAdj2}`);

    // ======================================================================
    // 8. STOCK LEDGER AUDIT TRAIL VERIFICATION
    // ======================================================================
    console.log("\n--- SECTION 8: STOCK LEDGER AUDIT TRAIL VERIFICATION ---");

    const ledgerEntries = await prisma.stockLedger.findMany({
      where: { productId: product.id },
      orderBy: { createdAt: "asc" },
      include: {
        sourceLocation: true,
        destinationLocation: true,
      },
    });

    assert(ledgerEntries.length === 5, "Exact 5 Ledger Records Recorded", `Count: ${ledgerEntries.length}`);

    if (ledgerEntries.length >= 5) {
      // 1. Receipt +100
      assert(
        (ledgerEntries[0].operationType === "RECEIPT" || (ledgerEntries[0].operationType as string) === "RECEIPT") &&
        Math.abs(ledgerEntries[0].quantity) === 100,
        "Record 1: Receipt +100 KG to Rack A",
        `Type: ${ledgerEntries[0].operationType}, Qty: ${ledgerEntries[0].quantity}, Dest: ${ledgerEntries[0].destinationLocation?.name}`
      );

      // 2. Transfer 30
      assert(
        (ledgerEntries[1].operationType === "INTERNAL_TRANSFER" || (ledgerEntries[1].operationType as string) === "INTERNAL_TRANSFER" || (ledgerEntries[1].operationType as string) === "TRANSFER") &&
        Math.abs(ledgerEntries[1].quantity) === 30,
        "Record 2: Transfer 30 KG (Rack A -> Rack B)",
        `Type: ${ledgerEntries[1].operationType}, Qty: ${ledgerEntries[1].quantity}, From: ${ledgerEntries[1].sourceLocation?.name} -> To: ${ledgerEntries[1].destinationLocation?.name}`
      );

      // 3. Delivery -20
      assert(
        (ledgerEntries[2].operationType === "DELIVERY" || (ledgerEntries[2].operationType as string) === "DELIVERY") &&
        Math.abs(ledgerEntries[2].quantity) === 20,
        "Record 3: Delivery 20 KG from Rack B",
        `Type: ${ledgerEntries[2].operationType}, Qty: ${ledgerEntries[2].quantity}, Source: ${ledgerEntries[2].sourceLocation?.name}`
      );

      // 4. Adjustment -3
      assert(
        (ledgerEntries[3].operationType === ("INVENTORY_ADJUSTMENT" as any) || (ledgerEntries[3].operationType as string) === "ADJUSTMENT") &&
        Math.abs(ledgerEntries[3].quantity) === 3,
        "Record 4: Adjustment -3 KG (10 -> 7)",
        `Type: ${ledgerEntries[3].operationType}, Qty: ${ledgerEntries[3].quantity}`
      );

      // 5. Adjustment +5
      assert(
        (ledgerEntries[4].operationType === ("INVENTORY_ADJUSTMENT" as any) || (ledgerEntries[4].operationType as string) === "ADJUSTMENT") &&
        Math.abs(ledgerEntries[4].quantity) === 5,
        "Record 5: Adjustment +5 KG (7 -> 12)",
        `Type: ${ledgerEntries[4].operationType}, Qty: ${ledgerEntries[4].quantity}`
      );
    }

    // ======================================================================
    // 9. LOW STOCK ALERT LOGIC VERIFICATION
    // ======================================================================
    console.log("\n--- SECTION 9: LOW STOCK ALERT LOGIC VERIFICATION ---");

    // Case 9.1: Current 82, Min 100 -> LOW_STOCK
    await prisma.product.update({
      where: { id: product.id },
      data: { minimumStock: 100 },
    });
    const lowStockCheck1 = await productService.getProductById(product.id);
    assert(
      lowStockCheck1.totalStock === 82 && lowStockCheck1.stockStatus === "LOW_STOCK",
      "Threshold Rule 1: Min 100 > Stock 82 => LOW_STOCK",
      `Stock: ${lowStockCheck1.totalStock}, Min: ${lowStockCheck1.minimumStock}, Status: ${lowStockCheck1.stockStatus}`
    );

    // Case 9.2: Current 82, Min 50 -> IN_STOCK
    await prisma.product.update({
      where: { id: product.id },
      data: { minimumStock: 50 },
    });
    const lowStockCheck2 = await productService.getProductById(product.id);
    assert(
      lowStockCheck2.totalStock === 82 && lowStockCheck2.stockStatus === "IN_STOCK",
      "Threshold Rule 2: Min 50 <= Stock 82 => IN_STOCK",
      `Stock: ${lowStockCheck2.totalStock}, Min: ${lowStockCheck2.minimumStock}, Status: ${lowStockCheck2.stockStatus}`
    );

    // ======================================================================
    // 10. DASHBOARD KPI INTEGRATION VERIFICATION
    // ======================================================================
    console.log("\n--- SECTION 10: DASHBOARD LIVE QUERY VERIFICATION ---");
    const dashboardMetrics = await dashboardService.getDashboardKPIs();
    assert(typeof dashboardMetrics.totalProducts === "number" && dashboardMetrics.totalProducts > 0, "Dashboard Total Products verified", `Products: ${dashboardMetrics.totalProducts}`);
    assert(typeof dashboardMetrics.lowStockCount === "number", "Dashboard Low Stock count verified", `Count: ${dashboardMetrics.lowStockCount}`);
    assert(typeof dashboardMetrics.pendingReceipts === "number", "Dashboard Pending Receipts query verified", `Pending: ${dashboardMetrics.pendingReceipts}`);

    console.log("\n======================================================================");
    console.log(`🏁 WHOLE SYSTEM TEST COMPLETE: ${passedTests}/${totalTests} TESTS PASSED`);
    console.log("======================================================================\n");

    if (passedTests !== totalTests) {
      process.exit(1);
    }
  } catch (error) {
    console.error("FATAL ERROR DURING TEST EXECUTION:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runWholeSystemTest();
