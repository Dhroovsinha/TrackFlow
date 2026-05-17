"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { GOAL_STATUS_CONFIG } from "@/lib/constants";

export default function TeamPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "MANAGER"],
    queryFn: async () => { const r = await fetch("/api/dashboard"); return r.json(); },
  });

  if (isLoading) return <div className="space-y-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;

  const teamProgress = (data?.teamProgress || []) as Array<{ name: string; progress: number; goals: number; completed: number }>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Team Goals</h1>
        <p className="text-muted-foreground text-sm">Overview of your team&apos;s goal progress</p>
      </div>

      {teamProgress.length > 0 ? (
        <div className="grid gap-4">
          {teamProgress.map((member, i) => (
            <motion.div key={member.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-semibold shrink-0">
                    {member.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="font-semibold truncate">{member.name}</h3>
                      <span className="text-lg font-bold">{member.progress}%</span>
                    </div>
                    <Progress value={member.progress} className="h-2 mb-1" indicatorClassName={member.progress >= 75 ? "bg-green-500" : member.progress >= 50 ? "bg-blue-500" : "bg-yellow-500"} />
                    <p className="text-xs text-muted-foreground">{member.completed}/{member.goals} goals completed</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">No team members found</p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
