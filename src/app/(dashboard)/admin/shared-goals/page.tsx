"use client";

import { motion } from "framer-motion";
import { Share2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function SharedGoalsPage() {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Shared Goals</h1>
        <p className="text-muted-foreground text-sm">Configure departmental KPIs shared across employees</p>
      </div>
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <Share2 className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-lg font-medium">Shared Goals Configuration</p>
          <p className="text-sm text-muted-foreground mt-1">Assign shared KPIs to multiple employees. Goals are seeded with demo data.</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}
