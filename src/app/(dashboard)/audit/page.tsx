"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ScrollText, Filter } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { formatDateTime } from "@/lib/utils";
import { useState } from "react";

export default function AuditPage() {
  const [entityFilter, setEntityFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [page, setPage] = useState(1);

  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (entityFilter !== "all") params.set("entityType", entityFilter);
  if (actionFilter !== "all") params.set("action", actionFilter);

  const { data, isLoading } = useQuery({
    queryKey: ["audit", entityFilter, actionFilter, page],
    queryFn: async () => {
      const r = await fetch(`/api/audit?${params}`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const logs = (data?.logs || []) as Array<Record<string, unknown>>;
  const totalPages = data?.totalPages || 1;

  const actionColors: Record<string, string> = {
    CREATE: "success", UPDATE: "info", DELETE: "destructive", APPROVE: "success",
    REJECT: "destructive", RETURN: "warning", UNLOCK: "info", SUBMIT: "info", INLINE_EDIT: "warning",
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Audit Logs</h1>
        <p className="text-muted-foreground text-sm">Complete audit trail of all system activities</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            <SelectItem value="Goal">Goals</SelectItem>
            <SelectItem value="GoalSheet">Goal Sheets</SelectItem>
            <SelectItem value="QuarterlyUpdate">Updates</SelectItem>
          </SelectContent>
        </Select>
        <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setPage(1); }}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="CREATE">Create</SelectItem>
            <SelectItem value="UPDATE">Update</SelectItem>
            <SelectItem value="APPROVE">Approve</SelectItem>
            <SelectItem value="REJECT">Reject</SelectItem>
            <SelectItem value="SUBMIT">Submit</SelectItem>
            <SelectItem value="UNLOCK">Unlock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : logs.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-4 font-medium">User</th>
                    <th className="text-left py-3 px-4 font-medium">Action</th>
                    <th className="text-left py-3 px-4 font-medium">Entity</th>
                    <th className="text-left py-3 px-4 font-medium hidden lg:table-cell">Changes</th>
                    <th className="text-left py-3 px-4 font-medium">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => {
                    const user = log.user as Record<string, string>;
                    return (
                      <tr key={log.id as string} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                        <td className="py-3 px-4">
                          <p className="font-medium">{user?.name}</p>
                          <p className="text-xs text-muted-foreground">{user?.email}</p>
                        </td>
                        <td className="py-3 px-4">
                          <Badge variant={(actionColors[log.action as string] || "secondary") as "success" | "info" | "destructive" | "warning" | "secondary"}>
                            {log.action as string}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <p className="text-sm">{log.entityType as string}</p>
                          <p className="text-xs text-muted-foreground font-mono">{(log.entityId as string)?.slice(0, 8)}...</p>
                        </td>
                        <td className="py-3 px-4 hidden lg:table-cell">
                          {log.afterValue ? (
                            <pre className="text-xs bg-muted/50 p-1.5 rounded max-w-xs overflow-hidden text-ellipsis">
                              {JSON.stringify(log.afterValue, null, 0).slice(0, 80)}...
                            </pre>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="py-3 px-4 text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(log.createdAt as string)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <ScrollText className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">No audit logs found</p>
          </CardContent>
        </Card>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: totalPages }, (_, i) => (
            <button key={i} onClick={() => setPage(i + 1)} className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${page === i + 1 ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-accent"}`}>
              {i + 1}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
