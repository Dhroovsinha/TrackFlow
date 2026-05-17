"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrganizationPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "ADMIN"],
    queryFn: async () => { const r = await fetch("/api/dashboard"); return r.json(); },
  });

  if (isLoading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;

  const deptStats = (data?.departmentStats || []) as Array<Record<string, unknown>>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Organization</h1>
        <p className="text-muted-foreground text-sm">Department hierarchy and employee overview</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deptStats.map((dept, i) => (
          <motion.div key={dept.code as string} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{dept.name as string}</CardTitle>
                  <Badge variant="outline">{dept.code as string}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-accent/30">
                    <p className="text-2xl font-bold">{dept.employees as number}</p>
                    <p className="text-xs text-muted-foreground">Employees</p>
                  </div>
                  <div className="p-3 rounded-lg bg-accent/30">
                    <p className="text-2xl font-bold">{dept.totalGoals as number}</p>
                    <p className="text-xs text-muted-foreground">Goals</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <Badge variant={(dept.progress as number) >= 75 ? "success" : (dept.progress as number) >= 50 ? "info" : "warning"}>
                    {dept.progress as number}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {deptStats.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Building2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">No departments configured</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
