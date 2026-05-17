"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart3, Download } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";

export default function ReportsPage() {
  const { toast } = useToast();

  const { data, isLoading } = useQuery({
    queryKey: ["reports"],
    queryFn: async () => {
      const r = await fetch("/api/reports");
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
  });

  const reportData = (data?.reportData || []) as Array<Record<string, unknown>>;

  const exportCSV = () => {
    if (reportData.length === 0) return;
    const headers = Object.keys(reportData[0]).join(",");
    const rows = reportData.map((r) => Object.values(r).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "atomquest-report.csv"; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Report Downloaded", description: "CSV file exported successfully", type: "success" });
  };

  const exportExcel = async () => {
    try {
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(reportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Goals Report");
      XLSX.writeFile(wb, "atomquest-report.xlsx");
      toast({ title: "Report Downloaded", description: "Excel file exported successfully", type: "success" });
    } catch {
      toast({ title: "Export Failed", description: "Could not generate Excel file", type: "error" });
    }
  };

  if (isLoading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Reports</h1>
          <p className="text-muted-foreground text-sm">Planned vs Actual performance reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} disabled={reportData.length === 0}>
            <Download className="w-4 h-4" /> CSV
          </Button>
          <Button variant="outline" onClick={exportExcel} disabled={reportData.length === 0}>
            <Download className="w-4 h-4" /> Excel
          </Button>
        </div>
      </div>

      {reportData.length > 0 ? (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/30">
                    <th className="text-left py-3 px-3 font-medium">Employee</th>
                    <th className="text-left py-3 px-3 font-medium hidden md:table-cell">Department</th>
                    <th className="text-left py-3 px-3 font-medium">Goal</th>
                    <th className="text-center py-3 px-3 font-medium">Target</th>
                    <th className="text-center py-3 px-3 font-medium">Actual</th>
                    <th className="text-center py-3 px-3 font-medium">Progress</th>
                    <th className="text-center py-3 px-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {reportData.map((row, i) => (
                    <tr key={i} className="border-b border-border/30 hover:bg-accent/30">
                      <td className="py-2.5 px-3">
                        <p className="font-medium text-xs">{row.employeeName as string}</p>
                      </td>
                      <td className="py-2.5 px-3 hidden md:table-cell text-xs text-muted-foreground">{row.department as string}</td>
                      <td className="py-2.5 px-3 text-xs max-w-[200px] truncate">{row.goalTitle as string}</td>
                      <td className="py-2.5 px-3 text-center text-xs">{row.target as number}</td>
                      <td className="py-2.5 px-3 text-center text-xs font-medium">{row.achievement as number}</td>
                      <td className="py-2.5 px-3 text-center">
                        <Badge variant={(row.progress as number) >= 75 ? "success" : (row.progress as number) >= 50 ? "info" : "warning"} className="text-[10px]">
                          {Math.round(row.progress as number)}%
                        </Badge>
                      </td>
                      <td className="py-2.5 px-3 text-center text-xs">{row.status as string}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">No report data available</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
