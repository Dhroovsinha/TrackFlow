"use client";

import { motion } from "framer-motion";
import { Users, ClipboardCheck, TrendingUp, AlertTriangle, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

interface ManagerDashboardProps {
  data: Record<string, unknown>;
  userName: string;
}

const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export function ManagerDashboard({ data, userName }: ManagerDashboardProps) {
  const stats = data.stats as Record<string, number>;
  const pendingSheets = (data.pendingSheets || []) as Array<Record<string, unknown>>;
  const teamProgress = (data.teamProgress || []) as Array<{ name: string; progress: number; goals: number; completed: number }>;

  const kpiCards = [
    { title: "Team Size", value: stats.teamSize || 0, icon: Users, color: "from-violet-500 to-indigo-600" },
    { title: "Pending Approvals", value: stats.pendingApprovals || 0, icon: ClipboardCheck, color: "from-amber-500 to-orange-600" },
    { title: "Team Goals", value: stats.totalTeamGoals || 0, icon: TrendingUp, color: "from-emerald-500 to-teal-600" },
    { title: "At Risk", value: stats.atRiskTeamGoals || 0, icon: AlertTriangle, color: "from-red-500 to-rose-600" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h1 className="text-2xl md:text-3xl font-bold">
          Team Overview, <span className="gradient-text">{userName?.split(" ")[0]}</span>
        </h1>
        <p className="text-muted-foreground mt-1">Monitor your team&apos;s goal progress and approvals</p>
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
        {/* Pending Approvals */}
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Pending Approvals</CardTitle>
              <Link href="/approvals">
                <Badge variant="outline" className="cursor-pointer hover:bg-accent gap-1">
                  View All <ArrowUpRight className="w-3 h-3" />
                </Badge>
              </Link>
            </CardHeader>
            <CardContent>
              {pendingSheets.length > 0 ? (
                <div className="space-y-3">
                  {pendingSheets.slice(0, 5).map((sheet) => (
                    <div key={sheet.id as string} className="flex items-center justify-between p-3 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors">
                      <div>
                        <p className="font-medium text-sm">{sheet.userName as string}</p>
                        <p className="text-xs text-muted-foreground">{sheet.goalCount as number} goals • Submitted {formatDate(sheet.submittedAt as string)}</p>
                      </div>
                      <Link href="/approvals">
                        <Button size="sm" variant="outline">Review</Button>
                      </Link>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <ClipboardCheck className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No pending approvals</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Team Progress Chart */}
        <motion.div variants={item}>
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="text-lg">Team Progress</CardTitle>
            </CardHeader>
            <CardContent>
              {teamProgress.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={teamProgress}>
                    <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="progress" fill="oklch(0.55 0.22 265)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-48 flex items-center justify-center text-muted-foreground">
                  <p className="text-sm">No team data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Team Members Progress */}
      <motion.div variants={item}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Team Members Progress</CardTitle>
          </CardHeader>
          <CardContent>
            {teamProgress.length > 0 ? (
              <div className="space-y-4">
                {teamProgress.map((member) => (
                  <div key={member.name} className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                      {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium truncate">{member.name}</p>
                        <span className="text-sm font-semibold">{member.progress}%</span>
                      </div>
                      <Progress value={member.progress} className="h-2" indicatorClassName={member.progress >= 75 ? "bg-green-500" : member.progress >= 50 ? "bg-blue-500" : member.progress >= 25 ? "bg-yellow-500" : "bg-red-500"} />
                      <p className="text-xs text-muted-foreground mt-1">{member.completed}/{member.goals} goals completed</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">No team members found</p>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
