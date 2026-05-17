"use client";

import { motion } from "framer-motion";
import { Target, TrendingUp, CheckCircle, AlertTriangle, Clock, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { GOAL_STATUS_CONFIG } from "@/lib/constants";
import Link from "next/link";

interface EmployeeDashboardProps {
  data: Record<string, unknown>;
  userName: string;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export function EmployeeDashboard({ data, userName }: EmployeeDashboardProps) {
  const stats = data.stats as Record<string, number | string>;
  const statusDistribution = (data.statusDistribution || []) as Array<{ name: string; value: number; fill: string }>;
  const thrustAreaProgress = (data.thrustAreaProgress || []) as Array<{ name: string; progress: number }>;
  const goals = (data.goals || []) as Array<Record<string, unknown>>;

  const kpiCards = [
    {
      title: "Total Goals",
      value: stats.totalGoals || 0,
      icon: Target,
      color: "from-violet-500 to-indigo-600",
      change: `${stats.completedGoals || 0} completed`,
    },
    {
      title: "Overall Progress",
      value: `${stats.overallProgress || 0}%`,
      icon: TrendingUp,
      color: "from-emerald-500 to-teal-600",
      change: "Weighted average",
    },
    {
      title: "On Track",
      value: stats.goalsOnTrack || 0,
      icon: CheckCircle,
      color: "from-blue-500 to-cyan-600",
      change: "Active goals",
    },
    {
      title: "At Risk",
      value: stats.goalsAtRisk || 0,
      icon: AlertTriangle,
      color: "from-amber-500 to-orange-600",
      change: "Needs attention",
    },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Welcome */}
      <motion.div variants={item}>
        <h1 className="text-2xl md:text-3xl font-bold">
          Welcome back, <span className="gradient-text">{userName?.split(" ")[0]}</span>
        </h1>
        <p className="text-muted-foreground mt-1">Here&apos;s your goal progress overview</p>
      </motion.div>

      {/* KPI Cards */}
      <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} className="relative overflow-hidden hover:shadow-lg transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground font-medium">{kpi.title}</p>
                  <p className="text-3xl font-bold mt-1">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{kpi.change}</p>
                </div>
                <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center shadow-lg`}>
                  <kpi.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Goal Status Pie Chart */}
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
                        {statusDistribution.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
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
                  <div className="text-center">
                    <Target className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No goals created yet</p>
                    <Link href="/goals" className="text-xs text-primary hover:underline mt-1 inline-block">Create your first goal →</Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Thrust Area Progress */}
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Progress by Thrust Area</CardTitle>
            </CardHeader>
            <CardContent>
              {thrustAreaProgress.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={thrustAreaProgress} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="progress" fill="oklch(0.55 0.22 265)" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  <p className="text-sm">No progress data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Goals Table */}
      <motion.div variants={item}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">My Goals</CardTitle>
            <Link href="/goals">
              <Badge variant="outline" className="cursor-pointer hover:bg-accent gap-1">
                View All <ArrowUpRight className="w-3 h-3" />
              </Badge>
            </Link>
          </CardHeader>
          <CardContent>
            {goals.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border/50">
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground">Goal</th>
                      <th className="text-left py-3 px-2 font-medium text-muted-foreground hidden md:table-cell">Thrust Area</th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground">Weight</th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground">Progress</th>
                      <th className="text-center py-3 px-2 font-medium text-muted-foreground">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {goals.map((goal) => {
                      const statusKey = goal.status as keyof typeof GOAL_STATUS_CONFIG;
                      const statusConfig = GOAL_STATUS_CONFIG[statusKey];
                      const progress = Number(goal.progress) || 0;
                      return (
                        <tr key={goal.id as string} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                          <td className="py-3 px-2">
                            <div>
                              <p className="font-medium">{goal.title as string}</p>
                              <p className="text-xs text-muted-foreground">Target: {goal.target as number} {goal.uom as string}</p>
                            </div>
                          </td>
                          <td className="py-3 px-2 hidden md:table-cell text-muted-foreground">{goal.thrustArea as string}</td>
                          <td className="py-3 px-2 text-center font-medium">{goal.weightage as number}%</td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-2 justify-center">
                              <Progress value={Math.min(progress, 100)} className="w-16 h-1.5" />
                              <span className="text-xs font-medium w-10 text-right">{Math.round(progress)}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-2 text-center">
                            <Badge variant={statusKey === "COMPLETED" ? "success" : statusKey === "AT_RISK" ? "warning" : statusKey === "ON_TRACK" ? "info" : "secondary"}>
                              {statusConfig?.label || goal.status as string}
                            </Badge>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No goals yet</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
