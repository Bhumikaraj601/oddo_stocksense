# StockSense — Modular Inventory Management System

> **Odoo Hackathon Project**  
> **Status:** Phase 1 — Project Foundation & Architecture (Complete)

---

## 📌 Project Overview

**StockSense** is a modern, modular, and scalable Inventory Management System designed to centralize warehouse operations, optimize stock levels, and provide complete traceability across multi-warehouse locations.

The core purpose of StockSense is to maintain accurate inventory levels by automatically recording and updating stock whenever warehouse operations (receipts, deliveries, internal transfers, and physical adjustments) are executed.

---

## 🚀 Tech Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16 (App Router)** | React Server Components, high performance, file-based routing |
| **Language** | **TypeScript (Strict Mode)** | End-to-end type safety across client, services, and database |
| **Styling & UI** | **Tailwind CSS + CVA + Lucide** | Responsive, modern dark/light UI design system |
| **Database ORM** | **Prisma ORM (v6)** | Type-safe schema definition, migrations, and query generation |
| **Database** | **PostgreSQL** | Relational data integrity, ACID transactions, and indexes |
| **Validation** | **Zod** | Schema validation for API payloads, forms, and business logic |
| **Forms** | **React Hook Form** | High-performance form state management |

---

## 🏗️ Layered Architecture

StockSense enforces a strict separation of concerns:

```text
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App Router                       │
│        (UI Components / Pages / Route Handlers)             │
└─────────────────────────────┬───────────────────────────────┘
                              │ Validates payload with Zod
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                          │
│        (Business logic, domain invariants, workflows)       │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Repository Layer                         │
│        (Data access queries, transactions, relations)       │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Prisma ORM Singleton                     │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                     │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Directory Structure

```text
oddo_stocksense/
├── prisma/
│   └── schema.prisma         # Comprehensive PostgreSQL schema & models
│
├── src/
│   ├── app/                  # Next.js App Router pages and API endpoints
│   │   ├── (auth)/login/     # Auth-ready structural placeholder
│   │   ├── dashboard/        # Main KPI dashboard and recent activity ledger
│   │   ├── products/         # Product catalog and category hierarchy
│   │   ├── operations/       # Operational workflows
│   │   │   ├── receipts/     # Incoming stock from vendors
│   │   │   ├── deliveries/   # Outgoing customer orders
│   │   │   ├── transfers/    # Inter-location warehouse transfers
│   │   │   ├── adjustments/  # Physical count discrepancies
│   │   │   └── ledger/       # Comprehensive audit movement history
│   │   ├── settings/
│   │   │   └── warehouses/   # Multi-warehouse and location hierarchy
│   │   └── api/
│   │       ├── health/       # Health check & database ping route
│   │       └── products/     # Layered CRUD route handler
│   │
│   ├── components/
│   │   ├── layout/           # AppShell, Sidebar navigation, Header
│   │   ├── ui/               # Reusable atomic UI elements (Card, Button, Badge, Input)
│   │   └── shared/           # KpiCard, StatusBadge, PageHeader, PlaceholderView
│   │
│   ├── lib/
│   │   ├── prisma.ts         # PrismaClient singleton (prevents dev reload exhaustion)
│   │   ├── constants/        # System enums, UOM list, navigation schema
│   │   ├── validations/      # Zod validation schemas (product, warehouse, operations)
│   │   └── utils/            # Styling helper (cn), formatters, typed API error handlers
│   │
│   ├── repositories/         # Database access layer (Product, Warehouse, Stock, Ledger)
│   ├── services/             # Business domain logic (Product, Stock, Operation, Dashboard)
│   ├── types/                # Domain types, DTOs, and extended relation types
│   └── config/               # Site settings and navigation definitions
│
├── .env                      # Local environment configuration
├── .env.example              # Safe environment variable template
├── .gitignore                # Git ignore rules protecting credentials and artifacts
├── package.json              # Project dependencies and scripts
├── tsconfig.json             # Strict TypeScript configuration
└── README.md                 # Project documentation
```

---

## 🗄️ Database Design & Models

The PostgreSQL schema (`prisma/schema.prisma`) defines the core entities:

1. **User & Roles**:
   - `User` with roles: `ADMIN`, `INVENTORY_MANAGER`, `WAREHOUSE_STAFF`.
2. **Catalog**:
   - `Category`: Self-referencing parent-child category tree.
   - `Product`: Name, unique `sku`, `uom` (Units, kg, liters, etc.), `isActive`, and category relation.
3. **Warehouses & Locations**:
   - `Warehouse`: Multiple distinct physical facilities.
   - `Location`: Hierarchical locations (Main Warehouse, Production Floor, Rack A, Bin 1) with `LocationType` (`INTERNAL`, `VENDOR`, `CUSTOMER`, `INVENTORY_LOSS`, `PRODUCTION`, `TRANSIT`).
4. **Stock & Reorder Rules**:
   - `Stock`: Maps `Product` + `Location` = `Current Quantity` (with reserved quantity support).
   - `ReorderRule`: Per-product min/max stock thresholds and reorder quantities.
5. **Inventory Operations**:
   - `Receipt` + `ReceiptItem`: Vendor incoming shipments.
   - `Delivery` + `DeliveryItem`: Customer outgoing delivery orders.
   - `InternalTransfer` + `InternalTransferItem`: Inter-location stock transfers.
   - `Adjustment` + `AdjustmentItem`: Theoretical vs. counted physical inventory reconciliation.
   - `OperationStatus` enum: `DRAFT`, `WAITING`, `READY`, `DONE`, `CANCELED`.
6. **Stock Ledger (Audit Trail)**:
   - `StockLedger`: Immutable chronological record of every movement with reference number, operation type, source/destination locations, quantity, and user accountability.

---

## ⚙️ Environment Setup

### 1. Clone & Install Dependencies

```bash
git clone <repo-url>
cd oddo_stocksense
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update your `.env` file with your PostgreSQL connection strings:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/stocksense_db?schema=public"
DIRECT_URL="postgresql://user:password@localhost:5432/stocksense_db?schema=public"

NEXT_PUBLIC_APP_NAME="StockSense"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

AUTH_SECRET="super-secret-jwt-key-min-32-chars-change-in-prod"
```

---

## 💾 Database Setup

### Validate Prisma Schema

```bash
npx prisma validate
```

### Generate Prisma Client

```bash
npx prisma generate
```

### Apply Migrations (when PostgreSQL is running)

```bash
npx prisma migrate dev --name init
```

*Note: If a PostgreSQL database is not connected during local inspection, Prisma Client types are already compiled and all models are fully accessible in offline mode.*

---

## 🖥️ Running Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to access the StockSense application shell and dashboard.

To run TypeScript verification:

```bash
npx tsc --noEmit
```

To run a production build:

```bash
npm run build
```
