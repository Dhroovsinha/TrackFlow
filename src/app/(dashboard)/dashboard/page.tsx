"use client";

import { useSession } from "next-auth/react";
import { useQuery } from "@tanstack/react-query";
import { EmployeeDashboard } from "@/components/dashboard/employee-dashboard";
import { ManagerDashboard } from "@/components/dashboard/manager-dashboard";
import { AdminDashboard } from "@/components/dashboard/admin-dashboard";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardPage() {
  const { data: session } = useSession();
  const role = (session?.user as Record<string, unknown>)?.role as string;

  const { data, isLoading, error } = useQuery({
    queryKey: ["dashboard", role],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to fetch dashboard");
      return res.json();
    },
    enabled: !!session,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-80 rounded-xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-lg font-medium text-destructive">Failed to load dashboard</p>
          <p className="text-sm text-muted-foreground mt-1">Please try refreshing the page</p>
        </div>
      </div>
    );
  }

  if (!session || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground animate-pulse">Initializing dashboard...</p>
      </div>
    );
  }

  if (role === "MANAGER") return <ManagerDashboard data={data} userName={session.user?.name || ""} />;
  if (role === "ADMIN") return <AdminDashboard data={data} />;
  return <EmployeeDashboard data={data} userName={session.user?.name || ""} />;
}
