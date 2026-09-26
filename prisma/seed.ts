import { PrismaClient, UserRole, LocationType } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding StockSense database...");

  // 1. Seed Demo Users
  const passwordHash = await bcrypt.hash("Password123!", 12);

  const manager = await prisma.user.upsert({
    where: { email: "manager@stocksense.io" },
    update: {},
    create: {
      name: "Alex Inventory Manager",
      email: "manager@stocksense.io",
      passwordHash,
      role: UserRole.INVENTORY_MANAGER,
      isActive: true,
    },
  });

  const staff = await prisma.user.upsert({
    where: { email: "staff@stocksense.io" },
    update: {},
    create: {
      name: "Sam Warehouse Staff",
      email: "staff@stocksense.io",
      passwordHash,
      role: UserRole.WAREHOUSE_STAFF,
      isActive: true,
    },
  });

  console.log(`✓ Seeded users: ${manager.email}, ${staff.email}`);

  // 2. Seed Default Categories
  const rawMaterials = await prisma.category.upsert({
    where: { name: "Raw Materials" },
    update: {},
    create: {
      name: "Raw Materials",
      description: "Basic metals, plastics, and unprocessed inventory",
      isActive: true,
    },
  });

  const electronics = await prisma.category.upsert({
    where: { name: "Electronics & Components" },
    update: {},
    create: {
      name: "Electronics & Components",
      description: "Semiconductors, PCBs, motors, and wiring",
      isActive: true,
    },
  });

  const finishedGoods = await prisma.category.upsert({
    where: { name: "Finished Goods" },
    update: {},
    create: {
      name: "Finished Goods",
      description: "Assembled and packaged consumer goods",
      isActive: true,
    },
  });

  const packaging = await prisma.category.upsert({
    where: { name: "Packaging Supplies" },
    update: {},
    create: {
      name: "Packaging Supplies",
      description: "Boxes, pallets, bubble wrap, and strapping",
      isActive: true,
    },
  });

  console.log("✓ Seeded categories: Raw Materials, Electronics, Finished Goods, Packaging");

  // 3. Seed Warehouses and Storage Locations
  const mainWarehouse = await prisma.warehouse.upsert({
    where: { code: "WH-MAIN" },
    update: {},
    create: {
      name: "Central Logistics Hub",
      code: "WH-MAIN",
      address: "100 Industrial Parkway, Zone 4",
      isActive: true,
    },
  });

  const rackA1 = await prisma.location.upsert({
    where: { code: "WH-MAIN-RACK-A1" },
    update: {},
    create: {
      name: "Rack A1 (Heavy Metals)",
      code: "WH-MAIN-RACK-A1",
      warehouseId: mainWarehouse.id,
      type: LocationType.INTERNAL,
      isScrap: false,
    },
  });

  const rackB2 = await prisma.location.upsert({
    where: { code: "WH-MAIN-RACK-B2" },
    update: {},
    create: {
      name: "Rack B2 (Electronics Bay)",
      code: "WH-MAIN-RACK-B2",
      warehouseId: mainWarehouse.id,
      type: LocationType.INTERNAL,
      isScrap: false,
    },
  });

  console.log("✓ Seeded warehouse & locations: WH-MAIN, Rack A1, Rack B2");

  // 4. Seed Initial Products
  const products = [
    {
      name: "Industrial Steel Ingot 50kg",
      sku: "RAW-STL-050",
      description: "High tensile structural carbon steel ingot",
      uom: "KG",
      categoryId: rawMaterials.id,
      initialLocationId: rackA1.id,
      initialQty: 120,
    },
    {
      name: "Copper Rod 10mm x 2m",
      sku: "RAW-CPR-010",
      description: "Pure electrolytic grade copper conductor rod",
      uom: "M",
      categoryId: rawMaterials.id,
      initialLocationId: rackA1.id,
      initialQty: 250,
    },
    {
      name: "High Torque Servo Motor 24V",
      sku: "ENG-SRV-024",
      description: "Precision brushless DC servo motor with optical encoder",
      uom: "PCS",
      categoryId: electronics.id,
      initialLocationId: rackB2.id,
      initialQty: 45,
    },
    {
      name: "Heavy Duty Corrugated Box (L)",
      sku: "PKG-BOX-LRG",
      description: "Double wall cardboard shipping box 60x40x40cm",
      uom: "BOX",
      categoryId: packaging.id,
      initialLocationId: rackA1.id,
      initialQty: 500,
    },
  ];

  for (const p of products) {
    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: {
        name: p.name,
        sku: p.sku,
        description: p.description,
        uom: p.uom,
        categoryId: p.categoryId,
        isActive: true,
      },
    });

    if (p.initialLocationId && p.initialQty > 0) {
      await prisma.stock.upsert({
        where: {
          productId_locationId: {
            productId: product.id,
            locationId: p.initialLocationId,
          },
        },
        update: {},
        create: {
          productId: product.id,
          locationId: p.initialLocationId,
          quantity: p.initialQty,
        },
      });
    }
  }

  console.log("✓ Seeded sample inventory products with initial stock");
  console.log("🎉 Seed finished successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
