import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { calculateProgress } from "@/lib/progress";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role;
    const userId = session.user.id;

    let where: Record<string, unknown> = {};
    if (role === "EMPLOYEE") {
      where = { goal: { userId } };
    } else if (role === "MANAGER") {
      const teamIds = (await prisma.user.findMany({ where: { managerId: userId }, select: { id: true } })).map(u => u.id);
      where = { goal: { userId: { in: [userId, ...teamIds] } } };
    }

    const updates = await prisma.quarterlyUpdate.findMany({
      where,
      include: {
        goal: { select: { title: true, target: true, uom: true, weightage: true, userId: true, user: { select: { name: true } } } },
        cycle: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({ updates });
  } catch (error) {
    console.error("Quarterly GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { goalId, cycleId, quarter, achievement, status, notes } = await req.json();

    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });
    if (goal.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const progress = calculateProgress(goal.uom, goal.target, achievement, goal.deadline);

    const update = await prisma.quarterlyUpdate.upsert({
      where: { goalId_cycleId_quarter: { goalId, cycleId, quarter } },
      update: { achievement, status, progress, notes, submittedAt: new Date() },
      create: { goalId, cycleId, quarter, achievement, status, progress, notes, submittedAt: new Date() },
    });

    // Update goal status
    await prisma.goal.update({ where: { id: goalId }, data: { status } });

    await createAuditLog({
      userId: session.user.id, entityType: "QuarterlyUpdate", entityId: update.id,
      action: "UPDATE", afterValue: { achievement, status, progress, quarter } as Record<string, unknown>,
    });

    return NextResponse.json({ update });
  } catch (error) {
    console.error("Quarterly POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
