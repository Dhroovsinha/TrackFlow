import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

// POST /api/admin/unlock - Admin unlock a goal
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role;
    if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { goalId } = await req.json();

    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    const updated = await prisma.goal.update({ where: { id: goalId }, data: { isLocked: false } });

    await prisma.approvalHistory.create({
      data: { goalId, reviewerId: session.user.id, action: "UNLOCKED", comments: "Admin unlock" },
    });

    await createAuditLog({
      userId: session.user.id, entityType: "Goal", entityId: goalId,
      action: "UNLOCK", beforeValue: { isLocked: true }, afterValue: { isLocked: false },
    });

    return NextResponse.json({ goal: updated });
  } catch (error) {
    console.error("Admin unlock error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
