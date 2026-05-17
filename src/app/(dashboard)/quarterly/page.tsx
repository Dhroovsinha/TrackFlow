"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CalendarDays, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { useState } from "react";
import { UOM_LABELS } from "@/lib/constants";

export default function QuarterlyPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const role = (session?.user as Record<string, unknown>)?.role as string;
  const [selectedQuarter, setSelectedQuarter] = useState("Q1");

  const { data: goalsData, isLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => { const r = await fetch("/api/goals"); return r.json(); },
  });

  const { data: cyclesData } = useQuery({
    queryKey: ["cycles"],
    queryFn: async () => { const r = await fetch("/api/cycles"); return r.json(); },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const r = await fetch("/api/quarterly", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast({ title: "Update Saved", type: "success" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, type: "error" }),
  });

  if (isLoading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>;

  const goals = (goalsData?.goals || []) as Array<Record<string, unknown>>;
  const cycles = (cyclesData?.cycles || []) as Array<Record<string, unknown>>;
  const activeCycle = cycles.find((c) => c.isActive);
  const lockedGoals = goals.filter((g) => g.isLocked);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quarterly Updates</h1>
          <p className="text-muted-foreground text-sm">Submit your quarterly achievement updates</p>
        </div>
        <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Q1">Q1 - July</SelectItem>
            <SelectItem value="Q2">Q2 - October</SelectItem>
            <SelectItem value="Q3">Q3 - January</SelectItem>
            <SelectItem value="Q4">Q4 - March</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {lockedGoals.length > 0 ? (
        <div className="grid gap-4">
          {lockedGoals.map((goal, i) => (
            <QuarterlyGoalCard
              key={goal.id as string}
              goal={goal}
              quarter={selectedQuarter}
              cycleId={activeCycle?.id as string}
              onSave={(data) => updateMutation.mutate(data)}
              saving={updateMutation.isPending}
              isManager={role === "MANAGER"}
              index={i}
            />
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <CalendarDays className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-lg font-medium">No approved goals</p>
            <p className="text-sm text-muted-foreground mt-1">Goals must be approved before quarterly updates can be submitted</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}

function QuarterlyGoalCard({ goal, quarter, cycleId, onSave, saving, isManager, index }: {
  goal: Record<string, unknown>;
  quarter: string;
  cycleId: string;
  onSave: (data: Record<string, unknown>) => void;
  saving: boolean;
  isManager: boolean;
  index: number;
}) {
  const updates = (goal.quarterlyUpdates || []) as Array<Record<string, unknown>>;
  const existing = updates.find((u) => u.quarter === quarter);

  const [achievement, setAchievement] = useState(existing?.achievement as number || 0);
  const [status, setStatus] = useState(existing?.status as string || "NOT_STARTED");
  const [notes, setNotes] = useState(existing?.notes as string || "");

  const progress = (goal.target as number) > 0 ? Math.round((achievement / (goal.target as number)) * 100) : 0;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}>
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold">{goal.title as string}</h3>
                <Badge variant="outline" className="text-[10px]">{quarter}</Badge>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mb-3">
                <span>Target: {goal.target as number} {UOM_LABELS[(goal.uom as keyof typeof UOM_LABELS)] || ""}</span>
                <span>Weight: {goal.weightage as number}%</span>
                <span>Thrust: {goal.thrustArea as string}</span>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Achievement</label>
                    <Input type="number" value={achievement} onChange={(e) => setAchievement(Number(e.target.value))} min={0} className="mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-muted-foreground">Status</label>
                    <Select value={status} onValueChange={setStatus}>
                      <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                        <SelectItem value="ON_TRACK">On Track</SelectItem>
                        <SelectItem value="COMPLETED">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Notes</label>
                  <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes about your progress..." rows={2} className="mt-1" />
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-between shrink-0 min-w-[120px]">
              <div className="text-center">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 -rotate-90">
                    <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" className="text-muted/30" strokeWidth="6" />
                    <circle cx="40" cy="40" r="34" fill="none" stroke="currentColor" className={progress >= 75 ? "text-green-500" : progress >= 50 ? "text-blue-500" : progress >= 25 ? "text-yellow-500" : "text-red-500"}
                      strokeWidth="6" strokeDasharray={`${(Math.min(progress, 100) / 100) * 213.6} 213.6`} strokeLinecap="round" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-sm font-bold">{Math.min(progress, 100)}%</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Progress</p>
              </div>
              <Button
                size="sm"
                onClick={() => onSave({ goalId: goal.id, cycleId, quarter, achievement, status, notes })}
                loading={saving}
                className="mt-3 w-full"
              >
                <Save className="w-3.5 h-3.5" /> Save
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
