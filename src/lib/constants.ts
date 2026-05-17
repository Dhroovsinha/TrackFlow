export const APP_NAME = "TrackFlow";
export const APP_DESCRIPTION = "Enterprise Goal Setting & Tracking Portal";

// Role labels
export const ROLE_LABELS = {
  EMPLOYEE: "Employee",
  MANAGER: "Manager",
  ADMIN: "Admin / HR",
} as const;

// Goal Sheet Status labels and colors
export const SHEET_STATUS_CONFIG = {
  DRAFT: { label: "Draft", color: "bg-gray-500", textColor: "text-gray-500", bgLight: "bg-gray-100 dark:bg-gray-800" },
  SUBMITTED: { label: "Submitted", color: "bg-blue-500", textColor: "text-blue-500", bgLight: "bg-blue-100 dark:bg-blue-900" },
  UNDER_REVIEW: { label: "Under Review", color: "bg-yellow-500", textColor: "text-yellow-500", bgLight: "bg-yellow-100 dark:bg-yellow-900" },
  APPROVED: { label: "Approved", color: "bg-green-500", textColor: "text-green-500", bgLight: "bg-green-100 dark:bg-green-900" },
  REJECTED: { label: "Rejected", color: "bg-red-500", textColor: "text-red-500", bgLight: "bg-red-100 dark:bg-red-900" },
  RETURNED: { label: "Returned", color: "bg-orange-500", textColor: "text-orange-500", bgLight: "bg-orange-100 dark:bg-orange-900" },
} as const;

// Goal Status labels and colors
export const GOAL_STATUS_CONFIG = {
  NOT_STARTED: { label: "Not Started", color: "bg-gray-500", textColor: "text-gray-400" },
  ON_TRACK: { label: "On Track", color: "bg-blue-500", textColor: "text-blue-400" },
  AT_RISK: { label: "At Risk", color: "bg-yellow-500", textColor: "text-yellow-400" },
  COMPLETED: { label: "Completed", color: "bg-green-500", textColor: "text-green-400" },
  CANCELLED: { label: "Cancelled", color: "bg-red-500", textColor: "text-red-400" },
} as const;

// UoM labels
export const UOM_LABELS = {
  NUMERIC: "Numeric",
  PERCENTAGE: "Percentage",
  TIMELINE: "Timeline",
  ZERO_BASED: "Zero-Based",
} as const;

// Thrust areas
export const THRUST_AREAS = [
  "Revenue Growth",
  "Customer Satisfaction",
  "Operational Excellence",
  "Innovation & Technology",
  "People & Culture",
  "Compliance & Governance",
  "Cost Optimization",
  "Market Expansion",
  "Quality Assurance",
  "Strategic Initiatives",
] as const;

// Validation constants
export const VALIDATION = {
  MAX_GOALS_PER_SHEET: 8,
  MIN_WEIGHTAGE: 10,
  MAX_WEIGHTAGE: 100,
  TOTAL_WEIGHTAGE: 100,
  MIN_TARGET: 0,
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 2000,
} as const;

// Quarterly windows
export const QUARTERLY_WINDOWS = {
  GOAL_SETTING: { month: 5, label: "May" },
  Q1: { month: 7, label: "July" },
  Q2: { month: 10, label: "October" },
  Q3: { month: 1, label: "January" },
  Q4: { month: 3, label: "March/April" },
} as const;

// Approval actions
export const APPROVAL_ACTION_LABELS = {
  SUBMITTED: "Submitted",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  RETURNED: "Returned for Rework",
  UNLOCKED: "Unlocked",
  INLINE_EDITED: "Inline Edited",
} as const;

// Navigation items per role
export const NAV_ITEMS = {
  EMPLOYEE: [
    { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "My Goals", href: "/goals", icon: "Target" },
    { label: "Quarterly Updates", href: "/quarterly", icon: "CalendarDays" },
  ],
  MANAGER: [
    { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "My Goals", href: "/goals", icon: "Target" },
    { label: "Team Goals", href: "/team", icon: "Users" },
    { label: "Approvals", href: "/approvals", icon: "CheckCircle" },
    { label: "Quarterly Updates", href: "/quarterly", icon: "CalendarDays" },
  ],
  ADMIN: [
    { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
    { label: "Organization", href: "/admin/organization", icon: "Building2" },
    { label: "Cycles", href: "/admin/cycles", icon: "RefreshCw" },
    { label: "Shared Goals", href: "/admin/shared-goals", icon: "Share2" },
    { label: "Reports", href: "/reports", icon: "BarChart3" },
    { label: "Audit Logs", href: "/audit", icon: "ScrollText" },
  ],
} as const;
