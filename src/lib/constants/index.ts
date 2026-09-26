export const APP_CONFIG = {
  name: "StockSense",
  description: "Modern Modular Inventory Management System for Odoo Hackathon",
  version: "1.0.0",
  author: "StockSense Team",
};

export const UNITS_OF_MEASURE = [
  "PCS",
  "KG",
  "G",
  "L",
  "ML",
  "M",
  "BOX",
  "PACK",
  "Units",
  "Pallets",
] as const;

export type UnitOfMeasure = (typeof UNITS_OF_MEASURE)[number];

export const OPERATION_STATUSES = [
  "DRAFT",
  "WAITING",
  "READY",
  "DONE",
  "CANCELED",
] as const;

export const OPERATION_TYPES = [
  "RECEIPT",
  "DELIVERY",
  "INTERNAL_TRANSFER",
  "ADJUSTMENT",
] as const;

export const USER_ROLES = [
  "ADMIN",
  "INVENTORY_MANAGER",
  "WAREHOUSE_STAFF",
] as const;

export const LOCATION_TYPES = [
  "INTERNAL",
  "VENDOR",
  "CUSTOMER",
  "INVENTORY_LOSS",
  "PRODUCTION",
  "TRANSIT",
] as const;

export const NAVIGATION_ITEMS = [
  {
    title: "Dashboard",
    href: "/dashboard",
    icon: "LayoutDashboard",
  },
  {
    title: "Products",
    href: "/products",
    icon: "Package",
  },
  {
    title: "Operations",
    href: "/operations",
    icon: "ArrowLeftRight",
    children: [
      {
        title: "Receipts (Incoming)",
        href: "/operations/receipts",
        description: "Receive items from suppliers into warehouse",
      },
      {
        title: "Delivery Orders (Outgoing)",
        href: "/operations/deliveries",
        description: "Pick and pack goods for customer orders",
      },
      {
        title: "Internal Transfers",
        href: "/operations/transfers",
        description: "Move inventory between internal locations",
      },
      {
        title: "Inventory Adjustments",
        href: "/operations/adjustments",
        description: "Reconcile counted stock with physical count",
      },
      {
        title: "Stock Ledger / History",
        href: "/operations/ledger",
        description: "Traceable ledger of all stock movements",
      },
    ],
  },
  {
    title: "Settings",
    href: "/settings",
    icon: "Settings",
    children: [
      {
        title: "Categories",
        href: "/settings/categories",
        description: "Manage product categories and hierarchies",
      },
      {
        title: "Warehouses & Locations",
        href: "/settings/warehouses",
        description: "Configure physical & virtual storage locations",
      },
    ],
  },
] as const;
