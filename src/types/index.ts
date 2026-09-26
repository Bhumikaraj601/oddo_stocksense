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
  destinationLocation: Location;
  createdBy: Pick<User, "id" | "name" | "email">;
  items: (ReceiptItem & { product: Product })[];
};

export type DeliveryWithDetails = Delivery & {
  sourceLocation: Location;
  createdBy: Pick<User, "id" | "name" | "email">;
  items: (DeliveryItem & { product: Product })[];
};

export type InternalTransferWithDetails = InternalTransfer & {
  sourceLocation: Location;
  destinationLocation: Location;
  createdBy: Pick<User, "id" | "name" | "email">;
  items: (InternalTransferItem & { product: Product })[];
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
