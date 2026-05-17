# AtomQuest Architecture & System Design

This document contains the enterprise system architecture diagrams for the AtomQuest platform, detailing the high-level architecture, database schema, authentication flows, and core workflows.

## 1. High-Level System Architecture

```mermaid
graph TB
    %% Styling
    classDef client fill:#f9f9f9,stroke:#333,stroke-width:2px;
    classDef frontend fill:#e1f5fe,stroke:#0288d1,stroke-width:2px;
    classDef auth fill:#f3e5f5,stroke:#8e24aa,stroke-width:2px;
    classDef backend fill:#e8f5e9,stroke:#388e3c,stroke-width:2px;
    classDef db fill:#fff3e0,stroke:#f57c00,stroke-width:2px;

    %% Client Layer
    subgraph ClientLayer [Client Layer]
        User[Browser / Client]
    end

    %% Frontend Layer
    subgraph FrontendLayer [Next.js App Router - Frontend]
        UI[React Server Components]
        ClientUI[Client Components / UI]
        Dashboards[Role-Based Dashboards]
        Forms[Zod Validated Forms]
    end

    %% Auth Layer
    subgraph AuthLayer [Security & Access]
        AuthJS[Auth.js / NextAuth]
        Session[JWT Session Management]
        RBAC[RBAC Middleware / Policies]
    end

    %% API Layer
    subgraph APILayer [Next.js API Routes - Backend]
        GoalAPI[Goals & Sheets API]
        ReportAPI[Reporting & Export API]
        AuditAPI[Audit Logging API]
        ApprovalAPI[Workflow Approval API]
    end

    %% Data Layer
    subgraph DataLayer [Data Layer]
        Prisma[Prisma ORM Client]
        Pooler[Supabase Connection Pooler]
        PostgreSQL[(PostgreSQL DB)]
    end

    %% Connections
    User -->|HTTPS| FrontendLayer
    User -->|Login / Credentials| AuthLayer
    
    UI <--> ClientUI
    ClientUI --> Dashboards
    ClientUI --> Forms

    Forms -->|Validated Requests| APILayer
    Dashboards -->|Fetch Data| APILayer
    
    APILayer -->|Validates Session| AuthJS
    AuthJS --> Session
    Session --> RBAC
    RBAC -->|Authorize Action| APILayer

    GoalAPI --> Prisma
    ReportAPI --> Prisma
    AuditAPI --> Prisma
    ApprovalAPI --> Prisma

    Prisma -->|Port 6543| Pooler
    Pooler -->|Port 5432| PostgreSQL

    %% Apply Classes
    class ClientLayer client;
    class FrontendLayer frontend;
    class AuthLayer auth;
    class APILayer backend;
    class DataLayer db;
```

---

## 2. Database Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    %% Core Entities
    User ||--o{ Goal : "owns"
    User ||--o{ GoalSheet : "submits"
    User ||--o{ Comment : "writes"
    User ||--o{ ApprovalHistory : "reviews"
    User ||--o{ AuditLog : "performs"
    User }|--|| Department : "belongs to"
    User }|--o| User : "reports to (Manager)"

    %% Goal Management
    GoalSheet ||--o{ Goal : "contains"
    GoalSheet }|--|| QuarterlyCycle : "belongs to"
    
    Goal ||--o{ QuarterlyUpdate : "tracks"
    Goal ||--o{ Comment : "has"
    Goal ||--o{ ApprovalHistory : "has"
    Goal ||--o| SharedGoal : "can have"

    SharedGoal }o--|| User : "shared with"

    %% Entity Definitions
    Department {
        String id PK
        String name
        DateTime createdAt
    }

    User {
        String id PK
        String email
        String name
        String password
        String role "EMPLOYEE | MANAGER | ADMIN"
        String departmentId FK
        String managerId FK
    }

    QuarterlyCycle {
        String id PK
        String name
        String year
        DateTime startDate
        DateTime endDate
        Boolean isActive
    }

    GoalSheet {
        String id PK
        String userId FK
        String cycleId FK
        String status "DRAFT | SUBMITTED | APPROVED | REJECTED | RETURNED"
        DateTime approvedAt
    }

    Goal {
        String id PK
        String sheetId FK
        String userId FK
        String title
        String thrustArea
        String uom
        Float target
        Float weightage
        String status "NOT_STARTED | ON_TRACK | AT_RISK | COMPLETED"
        Boolean isLocked
    }

    QuarterlyUpdate {
        String id PK
        String goalId FK
        Float achievement
        Float progress
        String status
        String notes
    }

    Comment {
        String id PK
        String goalId FK
        String userId FK
        String text
    }

    ApprovalHistory {
        String id PK
        String goalId FK
        String reviewerId FK
        String action
    }

    AuditLog {
        String id PK
        String userId FK
        String action
        String entityType
        String entityId
    }
```

---

## 3. Authentication & RBAC Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client as User/Client
    participant NextAuth as Auth.js (NextAuth)
    participant Middleware as Next.js Middleware
    participant API as API Route
    participant DB as PostgreSQL

    Client->>NextAuth: POST /api/auth/callback/credentials (email, password)
    NextAuth->>DB: Fetch User & verify bcrypt password
    DB-->>NextAuth: User Record (id, role, departmentId)
    NextAuth-->>Client: Set secure HTTP-only JWT Cookie
    
    note over Client,API: Accessing a Protected Resource
    
    Client->>Middleware: Request /dashboard
    Middleware->>NextAuth: Decrypt & Validate JWT
    NextAuth-->>Middleware: Session { id, role }
    
    alt is Unauthenticated
        Middleware-->>Client: 302 Redirect to /login
    else is Authenticated
        Middleware->>Client: 200 OK (Load Dashboard UI)
    end
    
    note over Client,DB: Accessing a Protected API (e.g., PUT /api/goals)
    
    Client->>API: Request with Data Payload
    API->>NextAuth: Verify Session & Role
    
    alt Role Unauthorized
        API-->>Client: 403 Forbidden
    else Role Authorized
        API->>DB: Execute Query (Scoped by userId/managerId)
        DB-->>API: Data
        API-->>Client: 200 OK (JSON Response)
    end
```

---

## 4. Goal Approval Workflow

```mermaid
stateDiagram-v2
    [*] --> DRAFT : Employee creates Goal Sheet
    
    state DRAFT {
        [*] --> AddGoals
        AddGoals --> ValidateWeightage : Must equal 100%
    }
    
    DRAFT --> SUBMITTED : Employee Submits
    
    state SUBMITTED {
        [*] --> ManagerReview
    }
    
    ManagerReview --> APPROVED : Manager Approves
    ManagerReview --> REJECTED : Manager Rejects
    ManagerReview --> RETURNED : Manager Returns for Rework
    
    REJECTED --> DRAFT : Employee Edits
    RETURNED --> DRAFT : Employee Edits
    
    state APPROVED {
        [*] --> GoalsLocked
        GoalsLocked --> TrackingPhase : Goals ready for Quarterly Updates
    }
    
    APPROVED --> [*] : Cycle Completes
    
    %% Admin override
    GoalsLocked --> DRAFT : Admin Unlocks Goal
```

---

## 5. Quarterly Review & Reporting Flow

```mermaid
flowchart TD
    %% Styling
    classDef employee fill:#e3f2fd,stroke:#1565c0;
    classDef manager fill:#f3e5f5,stroke:#7b1fa2;
    classDef system fill:#fff3e0,stroke:#e65100;
    classDef admin fill:#e8f5e9,stroke:#2e7d32;

    Start((Start Quarter)) --> E1[Employee access Locked Goals]:::employee
    
    E1 --> E2[Enter Current Achievement & Notes]:::employee
    E2 --> S1{Progress Engine}:::system
    
    S1 -->|Calculates Progress %| S2[Update Goal Status]:::system
    S2 --> S3[Save Quarterly Update to DB]:::system
    
    S3 --> M1[Manager views Team Dashboard]:::manager
    M1 --> M2[Review Employee Progress]:::manager
    M2 --> M3[Add Check-in Comments]:::manager
    
    M3 --> A1[Admin generates Org Reports]:::admin
    A1 --> S4[Calculate Department Averages]:::system
    S4 --> A2[Export to CSV / Excel]:::admin
    
    A2 --> End((End Quarter))
```
