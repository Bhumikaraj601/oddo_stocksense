import {
  UserRole,
  OperationStatus,
  OperationType,
  LocationType,
  User,
  Category,
  Product,
  Warehouse,
  Location,
  Stock,
  ReorderRule,
  Supplier,
  Receipt,
  ReceiptItem,
  Delivery,
  DeliveryItem,
  InternalTransfer,
  InternalTransferItem,
  Adjustment,
  AdjustmentItem,
  StockLedger,
} from "@prisma/client";

// Re-export Prisma types & enums for domain usage
export {
  UserRole,
  OperationStatus,
  OperationType,
  LocationType,
};

export type {
  User,
  Category,
  Product,
  Warehouse,
  Location,
  Stock,
  ReorderRule,
  Supplier,
  Receipt,
  ReceiptItem,
  Delivery,
  DeliveryItem,
  InternalTransfer,
  InternalTransferItem,
  Adjustment,
  AdjustmentItem,
  StockLedger,
};

// Extended Domain Types
export type ProductWithRelations = Product & {
  category: Category;
  stocks: (Stock & { location: Location })[];
  reorderRules?: ReorderRule[];
};

export type StockWithProductAndLocation = Stock & {
  product: Product;
  location: Location & { warehouse?: Warehouse | null };
};

export type ReceiptWithDetails = Receipt & {
  supplier?: Supplier | null;
  warehouse?: Warehouse | null;
  destinationLocation?: Location | null;
  createdBy: Pick<User, "id" | "name" | "email">;
  validatedBy?: Pick<User, "id" | "name" | "email"> | null;
  items: (ReceiptItem & { product: Product; location?: Location | null })[];
};

export type DeliveryWithDetails = Delivery & {
  warehouse?: Warehouse | null;
  sourceLocation?: Location | null;
  createdBy: Pick<User, "id" | "name" | "email">;
  validatedBy?: Pick<User, "id" | "name" | "email"> | null;
  items: (DeliveryItem & { product: Product; location?: Location | null })[];
};

export type InternalTransferWithDetails = InternalTransfer & {
  sourceWarehouse?: Warehouse | null;
  sourceLocation: Location & { warehouse?: Warehouse | null };
  destinationWarehouse?: Warehouse | null;
  destinationLocation: Location & { warehouse?: Warehouse | null };
  createdBy: Pick<User, "id" | "name" | "email">;
  validatedBy?: Pick<User, "id" | "name" | "email"> | null;
  items: (InternalTransferItem & { product: Product & { category?: Category | null } })[];
};

export type AdjustmentWithDetails = Adjustment & {
  location: Location;
  createdBy: Pick<User, "id" | "name" | "email">;
  items: (AdjustmentItem & { product: Product })[];
};

export type StockLedgerWithDetails = StockLedger & {
  product: Product;
  sourceLocation?: Location | null;
  destinationLocation?: Location | null;
  performedBy?: Pick<User, "id" | "name" | "email"> | null;
};

// Dashboard KPI Interface
export interface DashboardKPIs {
  totalProducts: number;
  lowStockCount: number;
  outOfStockCount: number;
  pendingReceipts: number;
  pendingDeliveries: number;
  internalTransfersCount: number;
}

// Navigation Structure
export interface NavChildItem {
  title: string;
  href: string;
  description?: string;
}

export interface NavItem {
  title: string;
  href: string;
  icon: string;
  badge?: string | number;
  children?: readonly NavChildItem[];
}
