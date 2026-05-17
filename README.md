# AtomQuest — Goal Setting & Tracking Portal

<div align="center">

**Enterprise-grade Goal Setting, Tracking & Performance Management Platform**

Built for organizations where employees create goals, managers approve them, and admins oversee governance.

</div>

---

##  Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Setup database & seed demo data
npm run setup

# 3. Run tests (optional)
npm run test

# 4. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

##  Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| **Employee** | priya.sharma@atomquest.com | demo123 |
| **Manager** | rajesh.kumar@atomquest.com | demo123 |
| **Admin** | admin@atomquest.com | admin123 |

##  Features

### Goal Lifecycle Management
- ✅ Goal Sheet creation with thrust areas, UoM, targets, weightages
- ✅ Validation: Total weightage = 100%, min 10% per goal, max 8 goals
- ✅ Submission → Manager Review → Approve/Reject/Return workflow
- ✅ Goal locking after approval (Admin unlock available)

### Role-Based Access Control
- **Employee**: Create/edit goals, submit sheets, update quarterly achievements
- **Manager**: Review team goals, approve/reject, add check-in comments
- **Admin**: Manage cycles, unlock goals, view org analytics, audit logs

### Quarterly Tracking
- Q1 (July), Q2 (October), Q3 (January), Q4 (March/April)
- Per-goal achievement entry with progress auto-calculation
- Status tracking: Not Started → On Track → Completed

### Progress Calculation Engine
- **Numeric** (Higher is better): achievement / target
- **Percentage**: achievement / target
- **Timeline**: deadline-based completion
- **Zero-Based**: value == 0 → 100%, else → 0%

### Dashboards
- **Employee**: KPI cards, goal status pie chart, thrust area progress
- **Manager**: Team overview, pending approvals, member progress
- **Admin**: Org analytics, department progress, audit activity feed

### Audit Logging
- Complete audit trail: who changed what, before/after values
- Filterable by entity type and action
- Paginated, queryable audit log viewer

### Reporting
- Planned vs Actual reports
- CSV export
- Excel export (XLSX)

## 🛠 Tech Stack

| Category | Technology |
|----------|-----------|
| Frontend | Next.js 15, TypeScript, Tailwind CSS |
| UI Components | shadcn/ui (Radix), Framer Motion, Recharts |
| Backend | Next.js API Routes (REST) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| ORM | Prisma |
| Auth | NextAuth.js v5 (Auth.js) |
| State | TanStack Query (React Query) |
| Validation | Zod |
| Export | xlsx |

##  Project Structure

```
src/
├── app/
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── dashboard/        # Role-based dashboards
│   │   ├── goals/            # Goal management
│   │   ├── approvals/        # Manager approvals
│   │   ├── quarterly/        # Quarterly updates
│   │   ├── team/             # Team view
│   │   ├── reports/          # Reports & exports
│   │   ├── audit/            # Audit logs
│   │   └── admin/            # Admin pages
│   ├── api/                  # REST API routes
│   └── login/                # Login page
├── components/
│   ├── ui/                   # Reusable UI components
│   ├── layout/               # Sidebar, Header
│   └── dashboard/            # Dashboard components
├── lib/                      # Utilities, constants, engine
├── providers/                # Theme, Auth, Query providers
└── types/                    # TypeScript types
```

##  Database Commands

```bash
npm run db:generate   # Generate Prisma client
npm run db:push       # Push schema to database
npm run db:seed       # Seed demo data
npm run db:studio     # Open Prisma Studio
npm run db:reset      # Reset and re-seed
npm run setup         # Full setup (generate + push + seed)
```

##  Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database - PostgreSQL via Supabase (Connection Pooling for Vercel)
DATABASE_URL="postgresql://user:password@host:6543/db?pgbouncer=true"

# Direct connection for Prisma migrations
DIRECT_URL="postgresql://user:password@host:5432/db"

AUTH_SECRET="your-secret-key-generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000" # Update for production
```

##  Demo Data

The seed script creates:
- **6 departments**: Engineering, Product, Marketing, HR, Finance, Sales
- **1 admin**, **4 managers**, **10 employees**
- **5 goal sheets** with realistic enterprise goals
- **Quarterly updates** with progress data
- **14 audit log entries**
- **3 manager check-in comments**

##  Demo Flow

1. **Employee** (Priya Sharma) → Views dashboard → Creates/edits goals
2. **Manager** (Rajesh Kumar) → Reviews pending approvals → Approves/rejects
3. **Employee** → Goals become locked → Submits quarterly updates
4. **Manager** → Views team progress → Adds check-in comments
5. **Admin** (Ananya Patel) → Views org analytics → Manages cycles → Reviews audit logs

##  Responsive Design

Fully responsive across desktop, tablet, and mobile devices. Collapsible sidebar with mobile drawer support.

## Security

- **Password Hashing**: Secure bcrypt hashing for all credentials.
- **Session Security**: JWT-based session management (`next-auth`) with typed boundaries.
- **Strict RBAC Enforcement**:
  - Employee: Isolated to self-authored goals.
  - Manager: Team-scoped visibility and approval capabilities.
  - Admin: Full organizational analytics.
- **Database Safety**: 
  - Prevents Insecure Direct Object Reference (IDOR) at the API query level.
  - Transactions (`$transaction`) guarantee ACID compliance for workflows.
- **Input Validation**: Zero-trust API validation using strict `Zod` schemas.

## 🧪 Testing Infrastructure

The application includes an automated CI/CD-ready testing suite:

- **Unit Testing (`Vitest`)**: Comprehensive validation of the algorithmic Progress Engine and Zod Schemas.
- **End-to-End Testing (`Playwright`)**: Simulates the authentication workflow, verifies RBAC UI protections, and tests routing.

```bash
# Run Unit & Integration Tests
npm run test

# Run E2E Tests
npx playwright install
npm run test:e2e
```

---


