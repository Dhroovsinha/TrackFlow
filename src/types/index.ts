// Extend next-auth types
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name: string;
      email: string;
      image?: string | null;
      role: string;
      departmentId: string;
      departmentName: string;
      managerId: string | null;
    };
  }

  interface User {
    role: string;
    departmentId: string;
    departmentName: string;
    managerId: string | null;
  }
}

// removed next-auth/jwt module augmentation

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface DashboardStats {
  totalGoals: number;
  completedGoals: number;
  pendingApprovals: number;
  overallProgress: number;
  goalsOnTrack: number;
  goalsAtRisk: number;
  overdueUpdates: number;
  teamSize?: number;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  fill?: string;
}
