# Project Specification: Personal Productivity Hub (Next.js Full-stack)

## 1. Project Overview
**Role:** Act as a Senior Full-stack Software Architect & Developer.
**Objective:** Build a centralized "Productivity Hub" web application to manage tasks, reminders, subscriptions, and expenses.
**Architecture:** Monolithic Full-stack application using **Next.js** (App Router) where the Frontend (UI) and Backend (API) run together.

## 2. Crucial Technical Constraints (NON-NEGOTIABLE)
1.  **Single Port Architecture:** The entire application must run on **port 6666**.
    * *Action:* Configure `package.json` script `"dev"` to run `next dev -p 6666`.
2.  **Database & ORM:** Use **MySQL** connected via **Prisma ORM**.
    * *Action:* Use a **Singleton Pattern** for `PrismaClient` to prevent connection exhaustion during hot-reloading (HMR).
3.  **Data Layer Pattern:** STRICTLY use a **Service Layer** architecture.
    * ❌ DO NOT write database queries (e.g., `prisma.task.findMany`) directly inside API Routes or UI components.
    * ✅ DO create `src/services/taskService.ts`, `src/services/financeService.ts` and call these functions from your API Routes.
4.  **State Management:** Use **React Context** for global UI state (like Sidebar open/close, Theme) and **SWR** (or React Query) for server data fetching.

## 3. Tech Stack
* **Framework:** Next.js (Latest Stable, TypeScript, App Router `/app`).
* **Styling:** Tailwind CSS (Mobile-first, Dark mode supported via `class` strategy).
* **Database:** MySQL 8.0.
* **ORM:** Prisma.
* **Icons:** Lucide-react.
* **Charts:** Recharts.
* **Forms:** React Hook Form + Zod Validation.
* **Date Handling:** date-fns.

## 4. Database Schema (Prisma)
Create a `schema.prisma` file with exactly these models:

```prisma
// Enums
enum Priority { LOW, MEDIUM, HIGH }
enum Status { TODO, IN_PROGRESS, DONE }
enum Cycle { MONTHLY, YEARLY }
enum TxType { INCOME, EXPENSE }

model Task {
  id          Int       @id @default(autoincrement())
  title       String
  description String?   @db.Text
  dueDate     DateTime?
  priority    Priority  @default(MEDIUM)
  status      Status    @default(TODO)
  tags        String?   // Store as comma-separated string or JSON
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}

model Reminder {
  id        Int      @id @default(autoincrement())
  title     String
  dateTime  DateTime
  is recurring Boolean @default(false)
  isCompleted Boolean @default(false)
}

model Subscription {
  id              Int      @id @default(autoincrement())
  name            String
  price           Decimal  @db.Decimal(10, 2)
  billingCycle    Cycle
  nextBillingDate DateTime
  isActive        Boolean  @default(true)
  notes           String?
}

model Transaction {
  id          Int      @id @default(autoincrement())
  amount      Decimal  @db.Decimal(10, 2)
  type        TxType
  category    String
  description String?
  date        DateTime @default(now())
}

5. Implementation Phases (Execute in Order)
Please generate the code in the following steps. Stop after each step to let me verify or ask for the next one.

Phase 1: Project Scaffolding & Infrastructure
Setup Files:

package.json (with port 6666).

.env template (e.g., DATABASE_URL="mysql://root:password@localhost:3306/productivity_app").

tailwind.config.ts (configured for dark mode).

docker-compose.yml (for a local MySQL container).

Database Connection:

src/lib/prisma.ts: The robust Singleton instance code.

Initial schema.prisma.

Phase 2: Backend Services & APIs
Service Layer: Create src/services/taskService.ts implementing CRUD operations.

API Routes: Create src/app/api/tasks/route.ts (GET, POST) handling requests by calling the service layer.

Dashboard Aggregation: Create src/services/dashboardService.ts to fetch:

Count of pending tasks.

Total monthly expense (sum from Subscriptions + Transactions).

Reminders for today.

Phase 3: Frontend Architecture & Components
Layout: src/components/layout/Sidebar.tsx and Navbar.tsx.

Hooks: Create a generic useFetch hook or specific hooks like useTasks using SWR.

Dashboard Page: src/app/page.tsx displaying the summary cards (Widgets).

Phase 4: Feature Implementation
Task Board: A list view with filters (Status, Priority).

Finance View: A table for Subscriptions and a simple Pie Chart for expenses.