"use client";

import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, RotateCcw, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils";
import { UOM_LABELS } from "@/lib/constants";

export default function ApprovalsPage() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const role = (session?.user as Record<string, unknown>)?.role as string;

  const { data, isLoading } = useQuery({
    queryKey: ["approvals"],
    queryFn: async () => {
      const r = await fetch("/api/sheets");
      return r.json();
    },
  });

  const actionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: string; action: string }) => {
      const r = await fetch("/api/sheets", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      if (!r.ok) { const e = await r.json(); throw new Error(e.error); }
      return r.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast({ title: `Sheet ${vars.action === "approve" ? "Approved" : vars.action === "reject" ? "Rejected" : "Returned"}`, type: "success" });
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, type: "error" }),
  });

  if (isLoading) {
    return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>;
  }

  const sheets = (data?.sheets || []) as Array<Record<string, unknown>>;
  const pendingSheets = sheets.filter((s) => ["SUBMITTED", "UNDER_REVIEW"].includes(s.status as string) && (s as Record<string, unknown>).userId !== session?.user?.id);
  const reviewedSheets = sheets.filter((s) => ["APPROVED", "REJECTED", "RETURNED"].includes(s.status as string));

  if (role !== "MANAGER" && role !== "ADMIN") {
    return <div className="text-center py-12"><p className="text-muted-foreground">Access restricted to managers</p></div>;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Approvals</h1>
        <p className="text-muted-foreground text-sm">Review and approve team goal sheets</p>
      </div>

      {/* Pending */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Pending Review ({pendingSheets.length})</h2>
        {pendingSheets.length > 0 ? (
          <div className="grid gap-4">
            {pendingSheets.map((sheet) => {
              const goals = (sheet.goals || []) as Array<Record<string, unknown>>;
              const user = sheet.user as Record<string, unknown>;
              return (
                <Card key={sheet.id as string} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                            {(user?.name as string || "").split(" ").map(n => n[0]).join("").slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-semibold">{user?.name as string}</p>
                            <p className="text-xs text-muted-foreground">{user?.email as string} • Submitted {formatDate(sheet.submittedAt as string)}</p>
                          </div>
                        </div>
                        <div className="mt-3 overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b">
                                <th className="text-left py-1.5 font-medium">Goal</th>
                                <th className="text-left py-1.5 font-medium">Thrust Area</th>
                                <th className="text-center py-1.5 font-medium">UoM</th>
                                <th className="text-center py-1.5 font-medium">Target</th>
                                <th className="text-center py-1.5 font-medium">Weight</th>
                              </tr>
                            </thead>
                            <tbody>
                              {goals.map((g) => (
                                <tr key={g.id as string} className="border-b border-border/30">
                                  <td className="py-1.5">{g.title as string}</td>
                                  <td className="py-1.5 text-muted-foreground">{g.thrustArea as string}</td>
                                  <td className="py-1.5 text-center">{UOM_LABELS[(g.uom as keyof typeof UOM_LABELS)] || g.uom as string}</td>
                                  <td className="py-1.5 text-center">{g.target as number}</td>
                                  <td className="py-1.5 text-center font-medium">{g.weightage as number}%</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Total: {goals.reduce((s, g) => s + (g.weightage as number), 0)}% weightage across {goals.length} goals</p>
                      </div>
                      <div className="flex lg:flex-col gap-2 shrink-0">
                        <Button size="sm" variant="success" onClick={() => actionMutation.mutate({ id: sheet.id as string, action: "approve" })} loading={actionMutation.isPending}>
                          <CheckCircle className="w-4 h-4" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => actionMutation.mutate({ id: sheet.id as string, action: "return" })} loading={actionMutation.isPending}>
                          <RotateCcw className="w-4 h-4" /> Return
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => actionMutation.mutate({ id: sheet.id as string, action: "reject" })} loading={actionMutation.isPending}>
                          <XCircle className="w-4 h-4" /> Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500/30" />
              <p className="text-muted-foreground">All caught up! No pending approvals.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Reviewed */}
      {reviewedSheets.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-3">Previously Reviewed</h2>
          <div className="grid gap-3">
            {reviewedSheets.slice(0, 5).map((sheet) => {
              const user = sheet.user as Record<string, unknown>;
              return (
                <Card key={sheet.id as string} className="opacity-70">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-white text-xs font-semibold">
                        {(user?.name as string || "").split(" ").map(n => n[0]).join("").slice(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{user?.name as string}</p>
                        <p className="text-xs text-muted-foreground">{(sheet.goals as Array<unknown>)?.length || 0} goals</p>
                      </div>
                    </div>
                    <Badge variant={sheet.status === "APPROVED" ? "success" : sheet.status === "REJECTED" ? "destructive" : "warning"}>
                      {sheet.status as string}
                    </Badge>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
