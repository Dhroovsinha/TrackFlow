"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Target, Send, Edit2, Trash2, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/skeleton";
import { THRUST_AREAS, UOM_LABELS, GOAL_STATUS_CONFIG, SHEET_STATUS_CONFIG } from "@/lib/constants";

export default function GoalsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Record<string, unknown> | null>(null);

  const { data: sheetsData, isLoading: sheetsLoading } = useQuery({
    queryKey: ["sheets"],
    queryFn: async () => { const r = await fetch("/api/sheets"); return r.json(); },
  });

  const { data: goalsData, isLoading: goalsLoading } = useQuery({
    queryKey: ["goals"],
    queryFn: async () => { const r = await fetch("/api/goals"); return r.json(); },
  });

  const { data: cyclesData } = useQuery({
    queryKey: ["cycles"],
    queryFn: async () => { const r = await fetch("/api/cycles"); return r.json(); },
  });

  const createSheetMutation = useMutation({
    mutationFn: async (cycleId: string) => {
      const r = await fetch("/api/sheets", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cycleId }) });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sheets"] });
      toast({ title: "Goal Sheet Created", type: "success" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, type: "error" }),
  });

  const createGoalMutation = useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const r = await fetch("/api/goals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      setShowCreateDialog(false);
      toast({ title: "Goal Created", type: "success" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, type: "error" }),
  });

  const deleteGoalMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/goals?id=${id}`, { method: "DELETE" });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      toast({ title: "Goal Deleted", type: "success" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, type: "error" }),
  });

  const submitSheetMutation = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch("/api/sheets", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action: "submit" }) });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
      return r.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sheets"] });
      toast({ title: "Goal Sheet Submitted", description: "Sent to manager for approval", type: "success" });
    },
    onError: (e: Error) => toast({ title: "Submission Failed", description: e.message, type: "error" }),
  });

  const sheets = (sheetsData?.sheets || []) as any[];
  const goals = (goalsData?.goals || []) as any[];
  const cycles = (cyclesData?.cycles || []) as any[];
  const activeSheet = sheets[0];
  const activeCycle = cycles.find((c) => c.isActive);

  if (sheetsLoading || goalsLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const sheetGoals = activeSheet ? goals.filter((g) => g.sheetId === activeSheet.id) : [];
  const totalWeightage = sheetGoals.reduce((s, g) => s + (g.weightage as number), 0);
  const sheetStatus = activeSheet?.status as string;
  const canEdit = !sheetStatus || ["DRAFT", "RETURNED"].includes(sheetStatus);
  const canSubmit = canEdit && sheetGoals.length > 0 && Math.abs(totalWeightage - 100) < 0.01;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Goals</h1>
          <p className="text-muted-foreground text-sm">Create, manage, and track your performance goals</p>
        </div>
        <div className="flex gap-2">
          {!activeSheet && activeCycle && (
            <Button onClick={() => createSheetMutation.mutate(activeCycle.id as string)} loading={createSheetMutation.isPending}>
              <Plus className="w-4 h-4" /> New Goal Sheet
            </Button>
          )}
          {canEdit && activeSheet && (
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4" /> Add Goal
            </Button>
          )}
          {canSubmit && activeSheet && (
            <Button variant="success" onClick={() => submitSheetMutation.mutate(activeSheet.id as string)} loading={submitSheetMutation.isPending}>
              <Send className="w-4 h-4" /> Submit Sheet
            </Button>
          )}
        </div>
      </div>

      {/* Sheet Status Banner */}
      {activeSheet && (
        <Card className="border-l-4" style={{ borderLeftColor: SHEET_STATUS_CONFIG[sheetStatus as keyof typeof SHEET_STATUS_CONFIG]?.color.replace("bg-", "") || "#6b7280" }}>
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Badge variant={sheetStatus === "APPROVED" ? "success" : sheetStatus === "REJECTED" ? "destructive" : sheetStatus === "SUBMITTED" ? "info" : "secondary"}>
                {SHEET_STATUS_CONFIG[sheetStatus as keyof typeof SHEET_STATUS_CONFIG]?.label || sheetStatus}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {sheetGoals.length}/8 goals • Weightage: {totalWeightage}% / 100%
              </span>
            </div>
            {totalWeightage !== 100 && sheetGoals.length > 0 && canEdit && (
              <p className="text-xs text-amber-500">⚠ Total weightage must equal 100% to submit</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Goals List */}
      {sheetGoals.length > 0 ? (
        <div className="grid gap-4">
          {sheetGoals.map((goal, i) => {
            const statusKey = goal.status as keyof typeof GOAL_STATUS_CONFIG;
            const statusConfig = GOAL_STATUS_CONFIG[statusKey];
            return (
              <motion.div key={goal.id as string} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold">{goal.title as string}</h3>
                          {goal.isLocked && <Lock className="w-3.5 h-3.5 text-amber-500" />}
                          <Badge variant={statusKey === "COMPLETED" ? "success" : statusKey === "ON_TRACK" ? "info" : statusKey === "AT_RISK" ? "warning" : "secondary"} className="text-[10px]">
                            {statusConfig?.label || goal.status as string}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{goal.description as string}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
                          <span>Thrust: {goal.thrustArea as string}</span>
                          <span>UoM: {UOM_LABELS[(goal.uom as keyof typeof UOM_LABELS)] || goal.uom as string}</span>
                          <span>Target: {goal.target as number}</span>
                          <span className="font-medium text-foreground">Weight: {goal.weightage as number}%</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {canEdit && !goal.isLocked && (
                          <>
                            <Button variant="ghost" size="icon" onClick={() => setEditingGoal(goal)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteGoalMutation.mutate(goal.id as string)}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    {/* Progress bar for goals with updates */}
                    {(goal.quarterlyUpdates as Array<Record<string, unknown>>)?.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-border/30">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>Achievement: {(goal.quarterlyUpdates as Array<Record<string, unknown>>)[0]?.achievement as number || 0}</span>
                          <span>{Math.round((goal.quarterlyUpdates as Array<Record<string, unknown>>)[0]?.progress as number || 0)}%</span>
                        </div>
                        <Progress value={Math.min((goal.quarterlyUpdates as Array<Record<string, unknown>>)[0]?.progress as number || 0, 100)} className="h-1.5" />
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : activeSheet ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-lg font-medium">No goals yet</p>
            <p className="text-sm text-muted-foreground mt-1">Start adding goals to your sheet</p>
            {canEdit && (
              <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                <Plus className="w-4 h-4" /> Add Your First Goal
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Target className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-lg font-medium">No goal sheet</p>
            <p className="text-sm text-muted-foreground mt-1">Create a goal sheet to get started</p>
            {activeCycle && (
              <Button className="mt-4" onClick={() => createSheetMutation.mutate(activeCycle.id as string)}>
                <Plus className="w-4 h-4" /> Create Goal Sheet
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Goal Dialog */}
      <GoalDialog
        open={showCreateDialog || !!editingGoal}
        onClose={() => { setShowCreateDialog(false); setEditingGoal(null); }}
        onSubmit={(data) => {
          if (editingGoal) {
            fetch("/api/goals", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ id: editingGoal.id, ...data }),
            }).then((r) => {
              if (r.ok) {
                queryClient.invalidateQueries({ queryKey: ["goals"] });
                setEditingGoal(null);
                toast({ title: "Goal Updated", type: "success" });
              }
            });
          } else if (activeSheet) {
            createGoalMutation.mutate({ ...data, sheetId: activeSheet.id });
          }
        }}
        initialData={editingGoal}
        loading={createGoalMutation.isPending}
      />
    </motion.div>
  );
}

function GoalDialog({
  open, onClose, onSubmit, initialData, loading,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: Record<string, unknown>) => void;
  initialData: Record<string, unknown> | null;
  loading: boolean;
}) {
  const [form, setForm] = useState({
    thrustArea: (initialData?.thrustArea as string) || "",
    title: (initialData?.title as string) || "",
    description: (initialData?.description as string) || "",
    uom: (initialData?.uom as string) || "NUMERIC",
    target: (initialData?.target as number) || 0,
    weightage: (initialData?.weightage as number) || 10,
  });

  // Reset form when dialog opens with new data
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ ...form, target: Number(form.target), weightage: Number(form.weightage) });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData ? "Edit Goal" : "Create New Goal"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Thrust Area</Label>
            <Select value={form.thrustArea} onValueChange={(v) => setForm({ ...form, thrustArea: v })}>
              <SelectTrigger><SelectValue placeholder="Select thrust area" /></SelectTrigger>
              <SelectContent>
                {THRUST_AREAS.map((area) => <SelectItem key={area} value={area}>{area}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Goal Title</Label>
            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Enter goal title" required />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Describe your goal" rows={3} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Unit of Measurement</Label>
              <Select value={form.uom} onValueChange={(v) => setForm({ ...form, uom: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(UOM_LABELS).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Target</Label>
              <Input type="number" value={form.target} onChange={(e) => setForm({ ...form, target: Number(e.target.value) })} min={0} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Weightage (%)</Label>
            <Input type="number" value={form.weightage} onChange={(e) => setForm({ ...form, weightage: Number(e.target.value) })} min={10} max={100} required />
            <p className="text-xs text-muted-foreground">Min 10%, Max 100%. Total across all goals must equal 100%.</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading}>{initialData ? "Update" : "Create"} Goal</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
