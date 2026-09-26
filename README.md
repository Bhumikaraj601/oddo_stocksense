# StockSense — Enterprise Inventory & Warehouse Management System

> **Odoo Hackathon Project**  
> A high-performance, modular Inventory Management System built with **Next.js 16 (App Router)**, **TypeScript**, **Prisma ORM**, and **PostgreSQL**.

---

## 📌 1. System Overview

**StockSense** is an enterprise-grade, modular inventory management system designed to streamline warehouse operations, maintain absolute inventory integrity, and provide end-to-end traceability across multi-facility storage hierarchies.

StockSense manages the entire lifecycle of physical goods:
- **Receipts**: Receiving goods from suppliers and crediting warehouse storage locations.
- **Internal Transfers**: Relocating stock across warehouses, racks, and bins with zero invariant loss.
- **Deliveries**: Picking, packing, and dispatching customer orders with atomic stock reduction.
- **Inventory Adjustments**: Reconciling physical cycle counts against theoretical system balances.
- **Stock Ledger**: Maintaining an immutable, double-entry audit trail of every unit movement.
- **Low Stock Intelligence**: Monitoring minimum stock thresholds and automating reorder triggers.

---

## 🚀 2. Technology Stack

| Layer | Technology | Key Capabilities |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16 (App Router)** | React Server Components, Client Components, Turbopack, Dynamic Routing |
| **Language** | **TypeScript (Strict Mode)** | 100% end-to-end type safety from UI to database |
| **Styling & Design System** | **Tailwind CSS + Lucide Icons** | Professional dark/light UI, responsive layouts, micro-interactions |
| **Database & ORM** | **PostgreSQL + Prisma ORM (v6)** | ACID transactions, foreign keys, compound indexes, relational integrity |
| **Authentication & Security** | **Bcrypt.js + Jose (JWT)** | Edge-compatible JWT in secure HTTP-only cookies, password hashing |
| **Validation & Schema** | **Zod** | Runtime request/service validation for all API inputs and forms |
| **State & Forms** | **React Hook Form** | Performant form management with instant inline feedback |

---

## 🏗️ 3. Layered Architecture

StockSense follows a clean **Separation of Concerns (SoC)** layered architecture:

```
┌─────────────────────────────────────────────────────────────┐
│                 Next.js App Router (UI / API)               │
│       • Pages & Modals (React Server & Client Components)   │
│       • REST API Route Handlers (/api/*)                    │
│       • Middleware Route Protection (/dashboard, etc.)      │
└─────────────────────────────┬───────────────────────────────┘
                              │ Runtime Zod Validation
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                          │
│       • Business domain logic & invariant enforcement       │
│       • Stock math calculations & status transitions        │
│       • Authorization checks (requireRole / requireAuth)    │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Repository Layer                         │
│       • Atomic Prisma Database Access                       │
│       • Interactive Multi-Query Transactions ($transaction) │
│       • Relational queries, pagination & complex filters    │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     PostgreSQL Database                     │
│       • 17 Relational Tables & Enums                        │
│       • Compound Unique Constraints & Foreign Keys          │
│       • Immutable Stock Ledger Movements                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 4. Core System Modules & Features

### 🔐 A. Authentication & Access Control
- **Role-Based Permissions**: Supports `ADMIN`, `INVENTORY_MANAGER`, and `WAREHOUSE_STAFF`.
- **JWT Session Management**: Edge-compatible JSON Web Tokens stored in secure, `httpOnly`, `sameSite: lax` cookies.
- **Route Guarding**: Next.js middleware guards protected paths (`/dashboard`, `/products`, `/operations/*`, `/settings/*`, `/profile`).
- **OTP Password Recovery**: 6-digit hashed OTP workflow with time-to-live expiration and attempt throttles.
- **User Profile Management**: Live profile details, name updates, and password rotation.

### 🏷️ B. Product & Category Management
- **Product Master Data**: Product name, SKU, Unit of Measure (KG, PCS, L, M, BOX, UNIT), category, and minimum stock threshold.
- **SKU Integrity**: Case-insensitive unique SKU enforcement prevents barcode collisions.
- **Category Hierarchy**: Category taxonomy with active/inactive statuses and live product count aggregates.
- **Stock by Location**: Real-time breakdown of physical on-hand quantity per warehouse location directly on the product detail view.
- **Safe Deactivation**: Products can be archived without breaking historical ledger movements or past orders.

### 🏭 C. Multi-Warehouse & Location Hierarchy
- **Multi-Facility Support**: Manage multiple distinct physical warehouses (Main Warehouse, Secondary Hub, Production Plant).
- **Hierarchical Locations**: Subdivide warehouses into functional zones and locations (`INTERNAL`, `VENDOR`, `CUSTOMER`, `INVENTORY_LOSS`, `PRODUCTION`, `TRANSIT`).
- **Compound Scoping**: Location codes are uniquely scoped per warehouse (`warehouseId_code`).
- **Scrap & Transit Management**: Flag dedicated scrap or staging locations for damaged or transit goods.

### 📥 D. Incoming Receipts (Vendor Inbound)
- **Document Sequencing**: Automatic sequential reference generation (`REC-000001`, `REC-000002`).
- **Operational Lifecycle**: `DRAFT` ➔ `READY` ➔ `DONE` (or `CANCELED`).
- **Multi-Line Item Support**: Add multiple products with destination location overrides.
- **Atomic Validation**: Validating a receipt atomically updates the location stock balance and inserts immutable ledger records within a single database transaction.
- **Idempotency Guard**: Receipts in `DONE` status cannot be validated again.

### 🔄 E. Internal Transfers (Inter-Location Movements)
- **Traceable Relocation**: Move inventory between racks, zones, or across different warehouses (`TRF-000001`).
- **Total Stock Invariant**: Transfers strictly preserve total inventory across the enterprise (Source decreases, Destination increases by identical amount).
- **Over-Transfer Prevention**: System verifies source location availability before allowing transfers; negative stock is blocked.

### 📤 F. Outgoing Deliveries (Customer Outbound)
- **Order Processing**: Customer dispatch workflow (`DEL-000001`) with picking and packing status progression.
- **Demand vs Delivered Verification**: Validates demand quantities against real-time on-hand stock.
- **Stock Decrement**: Dispatched quantities are atomically deducted from source location balances and written to the ledger.

### ⚖️ G. Physical Inventory Adjustments (Cycle Counting)
- **Reconciliation Workflow**: Resolves discrepancies between theoretical system stock and physical physical counts (`ADJ-000001`).
- **Delta Computation**: Automatically calculates whether an adjustment is a positive increase or negative shrinkage.
- **Audit Reason Tracking**: Requires structured notes/reasons (e.g., annual cycle count, damaged goods write-off).

### 📜 H. Stock Ledger & Move History
- **Single Source of Truth**: Unified movement log accessible at `/operations/move-history` and `/operations/ledger`.
- **Complete Audit Trail**: Records Timestamp, Product SKU/Name, Operation Type (`RECEIPT`, `DELIVERY`, `INTERNAL_TRANSFER`, `INVENTORY_ADJUSTMENT`), Reference Number, Source Location, Destination Location, Quantity Delta, and Responsible User.
- **Read-Only Invariant**: The Stock Ledger is strictly append-only and read-only; records can never be edited or deleted.

### 📊 I. Real-Time KPI Dashboard
- **Live Database Calculations**:
  - **Total Products**: Total active SKUs in the catalog.
  - **Total Inventory Quantity**: Real-time sum of all physical on-hand units across all locations.
  - **Low Stock SKUs**: Count of products whose current stock is below their minimum threshold.
  - **Out of Stock SKUs**: Count of products with 0 stock on hand.
  - **Pending Receipts**: Inbound shipments in `DRAFT` or `READY` status.
  - **Pending Deliveries**: Outbound customer orders awaiting dispatch.
  - **Scheduled Transfers**: Active inter-location transfers.
- **Recent Movements Table**: Live streaming view of the 5 most recent ledger operations.

### ⚠️ J. Automated Low Stock & Reordering Rules
- Dynamic status calculation evaluated directly against live database stock:
  - $\text{Stock} = 0 \implies \text{OUT\_OF\_STOCK}$
  - $0 < \text{Stock} \le \text{MinimumStock} \implies \text{LOW\_STOCK}$
  - $\text{Stock} > \text{MinimumStock} \implies \text{IN\_STOCK}$
- Dedicated Low Stock Alert view (`/products/low-stock`) for supply chain managers to trigger replenishments.

---

## 🗄️ 5. Database Schema & Data Model

The PostgreSQL schema (`prisma/schema.prisma`) comprises 17 tables:

```mermaid
erDiagram
    User ||--o{ Receipt : "creates / validates"
    User ||--o{ Delivery : "creates / validates"
    User ||--o{ InternalTransfer : "creates / validates"
    User ||--o{ Adjustment : "creates / validates"
    User ||--o{ StockLedger : "performs"
    User ||--o{ PasswordResetOTP : "owns"

    Category ||--o{ Category : "parent / children"
    Category ||--o{ Product : "contains"

    Warehouse ||--o{ Location : "houses"
    Warehouse ||--o{ Receipt : "receives"
    Warehouse ||--o{ Delivery : "dispatches"

    Product ||--o{ Stock : "has balance in"
    Location ||--o{ Stock : "stores"

    Product ||--o{ ReceiptItem : "itemized in"
    Receipt ||--o{ ReceiptItem : "contains"

    Product ||--o{ DeliveryItem : "itemized in"
    Delivery ||--o{ DeliveryItem : "contains"

    Product ||--o{ InternalTransferItem : "itemized in"
    InternalTransfer ||--o{ InternalTransferItem : "contains"

    Product ||--o{ AdjustmentItem : "itemized in"
    Adjustment ||--o{ AdjustmentItem : "contains"

    Product ||--o{ StockLedger : "movement logged"
    Location ||--o{ StockLedger : "source / dest"
    Product ||--o{ ReorderRule : "governed by"
```

---

## 🔄 6. Complete Inventory Lifecycle Walkthrough

Here is the exact lifecycle verified during end-to-end testing:

```text
1. INITIAL STATE
   Product: Steel Rod (SKU: ST-001, Min Stock: 50)
   Stock at Rack A: 0 KG | Stock at Rack B: 0 KG | Total Stock: 0 KG

2. RECEIPT VALIDATION (+100 KG to Rack A)
   • Receipt REC-000001 created and validated
   • Stock: Rack A = 100 KG, Rack B = 0 KG
   • Total Inventory = 100 KG
   • Ledger: [RECEIPT] +100 KG -> Rack A

3. INTERNAL TRANSFER (30 KG: Rack A -> Rack B)
   • Transfer TRF-000001 created and validated
   • Stock: Rack A = 70 KG, Rack B = 30 KG
   • Total Inventory = 100 KG (Invariant Preserved)
   • Ledger: [INTERNAL_TRANSFER] 30 KG (Rack A -> Rack B)

4. DELIVERY DISPATCH (-20 KG from Rack B)
   • Delivery DEL-000001 created and validated
   • Stock: Rack A = 70 KG, Rack B = 10 KG
   • Total Inventory = 80 KG
   • Ledger: [DELIVERY] -20 KG from Rack B

5. INVENTORY ADJUSTMENT 1 (Physical Count: 7 KG at Rack B)
   • Adjustment ADJ-000001 (Theoretical: 10 -> Counted: 7)
   • Stock: Rack A = 70 KG, Rack B = 7 KG
   • Total Inventory = 77 KG
   • Ledger: [INVENTORY_ADJUSTMENT] -3 KG at Rack B

6. INVENTORY ADJUSTMENT 2 (Physical Count: 12 KG at Rack B)
   • Adjustment ADJ-000002 (Theoretical: 7 -> Counted: 12)
   • Stock: Rack A = 70 KG, Rack B = 12 KG
   • Total Inventory = 82 KG
   • Ledger: [INVENTORY_ADJUSTMENT] +5 KG at Rack B

7. LOW STOCK THRESHOLD CHECK
   • If Min Stock = 100 KG (Stock 82 < 100) -> Status: LOW STOCK (Alert Triggered)
   • If Min Stock = 50 KG  (Stock 82 >= 50) -> Status: IN STOCK
```

---

## 🛠️ 7. Setup & Installation Guide

### Prerequisites
- **Node.js**: v18.18.0 or higher (v20+ recommended)
- **npm** or **yarn** / **pnpm**
- **PostgreSQL**: v14 or higher (or cloud provider e.g. Neon, Supabase, AWS RDS)

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd oddo_stocksense
npm install
```

### Step 2: Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your `.env` parameters:
```env
# PostgreSQL Database Connection Strings
DATABASE_URL="postgresql://username:password@localhost:5432/stocksense?schema=public"
DIRECT_URL="postgresql://username:password@localhost:5432/stocksense?schema=public"

# Application Config
NEXT_PUBLIC_APP_NAME="StockSense"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"

# JWT Secret for Session Cookies (32+ random characters)
AUTH_SECRET="your-32-character-long-secret-key-for-jwt-session"
```

### Step 3: Database Migration & Seeding
```bash
# Generate Prisma Client
npx prisma generate

# Apply Migrations to PostgreSQL
npx prisma migrate dev --name init

# Seed Default Categories, Warehouses, Locations & Admin User
npx prisma db seed
```

### Step 4: Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 8. Verification & Testing

### Automated Full-System Test Suite
StockSense includes an end-to-end real PostgreSQL verification script testing all 10 major lifecycle stages:
```bash
npx tsx scripts/test-whole-system.ts
```
*Executes and asserts all 44 automated database transactions, invariants, double-validation guards, and calculation rules.*

### Code Quality & Linting
```bash
npm run lint
```

### Production Build Verification
```bash
npm run build
```
*Compiles all 47 routes and validates 100% strict TypeScript typing.*

---

## 🌐 9. API Reference

| Route | Method | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `/api/auth/signup` | `POST` | Register a new user account | Public |
| `/api/auth/login` | `POST` | Authenticate user & issue session cookie | Public |
| `/api/auth/logout` | `POST` | Clear session cookie | Authenticated |
| `/api/auth/me` | `GET` | Get current authenticated user | Authenticated |
| `/api/dashboard` | `GET` | Aggregate KPI counts and recent movements | Authenticated |
| `/api/products` | `GET, POST` | List products / Create new product | Authenticated |
| `/api/products/[id]` | `GET, PUT, DELETE` | Get details / Update / Archive product | Authenticated |
| `/api/products/low-stock` | `GET` | List products below minimum stock | Authenticated |
| `/api/categories` | `GET, POST` | List / Create product categories | Authenticated |
| `/api/warehouses` | `GET, POST` | List / Create warehouses | Authenticated |
| `/api/warehouses/[id]/locations` | `GET, POST` | List / Create storage locations | Authenticated |
| `/api/receipts` | `GET, POST` | List receipts / Create inbound receipt | Authenticated |
| `/api/receipts/[id]/validate` | `POST` | Atomically validate receipt & credit stock | Manager / Admin |
| `/api/transfers` | `GET, POST` | List / Create internal transfer | Authenticated |
| `/api/transfers/[id]/validate` | `POST` | Validate transfer & update locations | Manager / Admin |
| `/api/deliveries` | `GET, POST` | List / Create outbound delivery | Authenticated |
| `/api/deliveries/[id]/validate` | `POST` | Validate delivery & debit stock | Manager / Admin |
| `/api/adjustments` | `GET, POST` | List / Create cycle count adjustment | Authenticated |
| `/api/adjustments/[id]/validate` | `POST` | Validate adjustment & reconcile delta | Manager / Admin |
| `/api/move-history` | `GET` | Paginated immutable stock ledger movements | Authenticated |
| `/api/health` | `GET` | System health check & database ping | Public |

---

## 🔒 10. Security & Data Integrity Highlights

1. **ACID Transaction Isolation**:
   - Every stock-changing operation uses `prisma.$transaction` with generous timeout guards (`timeout: 30000`) to guarantee that the operation document, location stock balance, and stock ledger entries either **all succeed together or roll back completely**.
2. **Zero Invariant Drift**:
   - Total inventory quantity across all locations strictly equals:
     $$\text{Total Stock} = \sum \text{Receipts} - \sum \text{Deliveries} \pm \sum \text{Adjustments}$$
   - Internal transfers never modify enterprise-wide inventory sums.
3. **Bcrypt + JWT Authentication**:
   - Passwords salted with 12 rounds.
   - Session tokens signed with HMAC-SHA256 and sent via `SameSite=Lax`, `HttpOnly` cookies.
4. **Client-Side Tampering Prevention**:
   - All stock quantities and location balances are validated on the server. Clients cannot arbitrarily manipulate quantities.
5. **No Secrets in Source Control**:
   - Database credentials and secrets are kept in `.env` files protected by `.gitignore`.

---

## 👥 11. Default Roles & Access Matrix

| Feature / Action | Admin | Inventory Manager | Warehouse Staff |
| :--- | :---: | :---: | :---: |
| View Dashboard & Inventory | ✅ | ✅ | ✅ |
| Search & View Products | ✅ | ✅ | ✅ |
| Create Draft Receipts / Transfers / Deliveries | ✅ | ✅ | ✅ |
| Validate Receipts & Deliveries | ✅ | ✅ | ❌ |
| Validate Physical Adjustments | ✅ | ✅ | ❌ |
| Create Warehouses & Locations | ✅ | ✅ | ❌ |
| Manage Categories | ✅ | ✅ | ❌ |
| User Profile & Password Change | ✅ | ✅ | ✅ |

---

## 📄 12. License & Credits

Developed for the **Odoo Hackathon**. Built with modern web standards and enterprise inventory architecture.
