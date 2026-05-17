"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { RefreshCw, Plus, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";

interface Cycle {
  id: string;
  name: string;
  year: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  phase: string;
}

export default function CyclesPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["cycles"],
    queryFn: async () => { const r = await fetch("/api/cycles"); return r.json(); },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const r = await fetch("/api/cycles", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, isActive }) });
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cycles"] });
      toast({ title: "Cycle Updated", type: "success" });
    },
  });

  if (isLoading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;

  const cycles = (data?.cycles || []) as Cycle[];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quarterly Cycles</h1>
          <p className="text-muted-foreground text-sm">Manage goal-setting and review cycles</p>
        </div>
      </div>

      <div className="grid gap-4">
        {cycles.map((cycle, i) => (
          <motion.div key={cycle.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className={cycle.isActive ? "border-primary/50 shadow-md" : ""}>
              <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${cycle.isActive ? "bg-primary/10 text-primary" : "bg-muted"}`}>
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold">{cycle.name} {cycle.year}</h3>
                      {cycle.isActive && <Badge variant="success">Active</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(cycle.startDate)} → {formatDate(cycle.endDate)}
                    </p>
                    <Badge variant="outline" className="mt-1 text-[10px]">{cycle.phase?.replace("_", " ")}</Badge>
                  </div>
                </div>
                <Button
                  variant={cycle.isActive ? "outline" : "default"}
                  size="sm"
                  onClick={() => toggleMutation.mutate({ id: cycle.id, isActive: !cycle.isActive })}
                  loading={toggleMutation.isPending}
                >
                  {cycle.isActive ? "Deactivate" : "Activate"}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {cycles.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center">
              <RefreshCw className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-muted-foreground">No cycles configured. Run the seed script to create demo data.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
