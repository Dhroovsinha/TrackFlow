import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role;
    const userId = session.user.id;

    let sheets;
    if (role === "ADMIN") {
      sheets = await prisma.goalSheet.findMany({
        include: { user: { select: { name: true, email: true, department: { select: { name: true } } } }, goals: true, cycle: true },
        orderBy: { createdAt: "desc" },
      });
    } else if (role === "MANAGER") {
      const teamIds = (await prisma.user.findMany({ where: { managerId: userId }, select: { id: true } })).map(u => u.id);
      sheets = await prisma.goalSheet.findMany({
        where: { userId: { in: [userId, ...teamIds] } },
        include: { user: { select: { name: true, email: true, department: { select: { name: true } } } }, goals: true, cycle: true },
        orderBy: { createdAt: "desc" },
      });
    } else {
      sheets = await prisma.goalSheet.findMany({
        where: { userId },
        include: { user: { select: { name: true, email: true, department: { select: { name: true } } } }, goals: true, cycle: true },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json({ sheets });
  } catch (error) {
    console.error("Sheets GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { cycleId } = await req.json();

    const cycle = await prisma.quarterlyCycle.findUnique({ where: { id: cycleId } });
    if (!cycle) return NextResponse.json({ error: "Cycle not found" }, { status: 404 });

    const existing = await prisma.goalSheet.findFirst({ where: { userId: session.user.id, cycleId } });
    if (existing) return NextResponse.json({ error: "Sheet already exists for this cycle", sheet: existing }, { status: 400 });

    const sheet = await prisma.goalSheet.create({
      data: { userId: session.user.id, cycleId },
    });

    await createAuditLog({ userId: session.user.id, entityType: "GoalSheet", entityId: sheet.id, action: "CREATE", afterValue: sheet as unknown as Record<string, unknown> });

    return NextResponse.json({ sheet }, { status: 201 });
  } catch (error) {
    console.error("Sheets POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id, action } = await req.json();
    const role = session.user.role;

    const sheet = await prisma.goalSheet.findUnique({ where: { id }, include: { goals: true } });
    if (!sheet) return NextResponse.json({ error: "Sheet not found" }, { status: 404 });

    if (action === "submit") {
      if (sheet.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      if (!["DRAFT", "RETURNED"].includes(sheet.status)) return NextResponse.json({ error: "Cannot submit" }, { status: 400 });

      const totalWeightage = sheet.goals.reduce((sum, g) => sum + g.weightage, 0);
      if (Math.abs(totalWeightage - 100) > 0.01) {
        return NextResponse.json({ error: `Total weightage must be 100%. Current: ${totalWeightage}%` }, { status: 400 });
      }
      if (sheet.goals.length === 0) return NextResponse.json({ error: "Add at least one goal" }, { status: 400 });

      const updated = await prisma.goalSheet.update({
        where: { id }, data: { status: "SUBMITTED", submittedAt: new Date() },
      });

      await createAuditLog({ userId: session.user.id, entityType: "GoalSheet", entityId: id, action: "SUBMIT", beforeValue: { status: sheet.status }, afterValue: { status: "SUBMITTED" } });

      return NextResponse.json({ sheet: updated });
    }

    if (action === "approve" || action === "reject" || action === "return") {
      if (role !== "MANAGER" && role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

      const statusMap: Record<string, string> = { approve: "APPROVED", reject: "REJECTED", return: "RETURNED" };
      const newStatus = statusMap[action];

      const updated = await prisma.$transaction(async (tx) => {
        const updatedSheet = await tx.goalSheet.update({
          where: { id },
          data: {
            status: newStatus as "APPROVED" | "REJECTED" | "RETURNED",
            ...(action === "approve" ? { approvedAt: new Date() } : {}),
            ...(action === "reject" ? { rejectedAt: new Date() } : {}),
            ...(action === "return" ? { returnedAt: new Date() } : {}),
          },
        });

        if (action === "approve") {
          await tx.goal.updateMany({ where: { sheetId: id }, data: { isLocked: true } });
        }

        for (const goal of sheet.goals) {
          await tx.approvalHistory.create({
            data: {
              goalId: goal.id, reviewerId: session.user.id,
              action: action === "approve" ? "APPROVED" : action === "reject" ? "REJECTED" : "RETURNED",
            },
          });
        }

        await tx.auditLog.create({
          data: {
            userId: session.user.id, entityType: "GoalSheet", entityId: id,
            action: action === "approve" ? "APPROVE" : action === "reject" ? "REJECT" : "RETURN",
            beforeValue: JSON.stringify({ status: sheet.status }),
            afterValue: JSON.stringify({ status: newStatus }),
          },
        });

        return updatedSheet;
      });

      return NextResponse.json({ sheet: updated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Sheets PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
