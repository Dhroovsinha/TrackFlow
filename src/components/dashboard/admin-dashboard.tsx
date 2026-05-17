"use client";

import { motion } from "framer-motion";
import { Users, Target, CheckCircle, ClipboardCheck, Building2, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { formatDateTime } from "@/lib/utils";

interface AdminDashboardProps {
  data: Record<string, unknown>;
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export function AdminDashboard({ data }: AdminDashboardProps) {
  const stats = data.stats as Record<string, number>;
  const departmentStats = (data.departmentStats || []) as Array<Record<string, unknown>>;
  const statusDistribution = (data.statusDistribution || []) as Array<{ name: string; value: number; fill: string }>;
  const recentAudits = (data.recentAudits || []) as Array<Record<string, unknown>>;

  const kpiCards = [
    { title: "Total Users", value: stats.totalUsers || 0, icon: Users, color: "from-violet-500 to-indigo-600" },
    { title: "Total Goals", value: stats.totalGoals || 0, icon: Target, color: "from-blue-500 to-cyan-600" },
    { title: "Completion Rate", value: `${stats.completionRate || 0}%`, icon: CheckCircle, color: "from-emerald-500 to-teal-600" },
    { title: "Pending Approvals", value: stats.pendingApprovals || 0, icon: ClipboardCheck, color: "from-amber-500 to-orange-600" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl md:text-3xl font-bold">
          <span className="gradient-text">Organization</span> Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">Enterprise-wide goal analytics and governance</p>
      </motion.div>

      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{kpi.title}</p>
                  <p className="text-3xl font-bold mt-1">{kpi.value}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-lg`}>
                  <kpi.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Goal Status Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              {statusDistribution.length > 0 ? (
                <div className="flex items-center gap-8">
                  <ResponsiveContainer width="50%" height={200}>
                    <PieChart>
                      <Pie data={statusDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                        {statusDistribution.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-3">
                    {statusDistribution.map((entry) => (
                      <div key={entry.name} className="flex items-center gap-2.5">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.fill }} />
                        <span className="text-sm">{entry.name}</span>
                        <span className="text-sm font-semibold ml-auto">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  <p className="text-sm">No data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Department Progress */}
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Department Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {departmentStats.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={departmentStats}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="progress" fill="oklch(0.55 0.22 265)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  <p className="text-sm">No department data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Department Details */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5" /> Department Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left py-3 px-2 font-medium text-muted-foreground">Department</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Employees</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Goals</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Completed</th>
                    <th className="text-center py-3 px-2 font-medium text-muted-foreground">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {departmentStats.map((dept) => (
                    <tr key={dept.code as string} className="border-b border-border/30 hover:bg-accent/30">
                      <td className="py-3 px-2 font-medium">{dept.name as string}</td>
                      <td className="py-3 px-2 text-center">{dept.employees as number}</td>
                      <td className="py-3 px-2 text-center">{dept.totalGoals as number}</td>
                      <td className="py-3 px-2 text-center">{dept.completedGoals as number}</td>
                      <td className="py-3 px-2 text-center">
                        <Badge variant={(dept.progress as number) >= 75 ? "success" : (dept.progress as number) >= 50 ? "info" : "warning"}>
                          {dept.progress as number}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Audit Logs */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5" /> Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentAudits.length > 0 ? (
              <div className="space-y-3">
                {recentAudits.slice(0, 8).map((log) => (
                  <div key={log.id as string} className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent/30 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">
                        <span className="font-medium">{(log.user as Record<string, string>)?.name}</span>{" "}
                        <span className="text-muted-foreground">{(log.action as string).toLowerCase()}</span>{" "}
                        <span>{log.entityType as string}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(log.createdAt as string)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No audit logs yet</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
