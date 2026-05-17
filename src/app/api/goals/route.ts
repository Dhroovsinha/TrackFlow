import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";

// GET /api/goals - Get goals for current user
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const sheetId = searchParams.get("sheetId");
    const userId = searchParams.get("userId") || session.user.id;
    const role = session.user.role;

    if (role === "EMPLOYEE" && userId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (role === "MANAGER" && userId !== session.user.id) {
      const isTeamMember = await prisma.user.findFirst({
        where: { id: userId, managerId: session.user.id },
      });
      if (!isTeamMember) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const where: Record<string, unknown> = { userId };
    if (sheetId) where.sheetId = sheetId;

    const goals = await prisma.goal.findMany({
      where,
      include: {
        quarterlyUpdates: { orderBy: { createdAt: "desc" } },
        sharedGoal: true,
        sheet: { select: { id: true, status: true, cycleId: true } },
        comments: {
          include: { user: { select: { name: true } } },
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: { sortOrder: "asc" },
    });

    return NextResponse.json({ goals });
  } catch (error) {
    console.error("Goals GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/goals - Create a new goal
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { sheetId, ...goalData } = body;

    const sheet = await prisma.goalSheet.findFirst({
      where: { id: sheetId, userId: session.user.id },
      include: { goals: true },
    });

    if (!sheet) return NextResponse.json({ error: "Goal sheet not found" }, { status: 404 });
    if (!["DRAFT", "RETURNED"].includes(sheet.status)) {
      return NextResponse.json({ error: "Sheet not editable" }, { status: 400 });
    }
    if (sheet.goals.length >= 8) {
      return NextResponse.json({ error: "Maximum 8 goals allowed" }, { status: 400 });
    }

    const goal = await prisma.goal.create({
      data: {
        sheetId,
        userId: session.user.id,
        thrustArea: goalData.thrustArea,
        title: goalData.title,
        description: goalData.description,
        uom: goalData.uom,
        target: goalData.target,
        weightage: goalData.weightage,
        deadline: goalData.deadline ? new Date(goalData.deadline) : null,
        sortOrder: sheet.goals.length,
      },
    });

    await createAuditLog({
      userId: session.user.id, entityType: "Goal", entityId: goal.id,
      action: "CREATE", afterValue: goal as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ goal }, { status: 201 });
  } catch (error) {
    console.error("Goals POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PUT /api/goals - Update a goal
export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { id, ...updates } = body;
    const role = session.user.role;

    const existing = await prisma.goal.findUnique({ where: { id }, include: { sheet: true } });
    if (!existing) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    if (role === "EMPLOYEE" && existing.userId !== session.user.id)
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (role === "EMPLOYEE" && existing.isLocked)
      return NextResponse.json({ error: "Goal is locked" }, { status: 403 });
    if (role === "EMPLOYEE" && !["DRAFT", "RETURNED"].includes(existing.sheet.status))
      return NextResponse.json({ error: "Cannot edit in current state" }, { status: 400 });

    const updated = await prisma.goal.update({ where: { id }, data: updates });

    await createAuditLog({
      userId: session.user.id, entityType: "Goal", entityId: id,
      action: "UPDATE",
      beforeValue: existing as unknown as Record<string, unknown>,
      afterValue: updated as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ goal: updated });
  } catch (error) {
    console.error("Goals PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/goals
export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

    const goal = await prisma.goal.findUnique({ where: { id }, include: { sheet: true } });
    if (!goal) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (goal.userId !== session.user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (goal.isLocked) return NextResponse.json({ error: "Locked" }, { status: 403 });
    if (!["DRAFT", "RETURNED"].includes(goal.sheet.status))
      return NextResponse.json({ error: "Cannot delete" }, { status: 400 });

    await prisma.goal.delete({ where: { id } });
    await createAuditLog({
      userId: session.user.id, entityType: "Goal", entityId: id,
      action: "DELETE", beforeValue: goal as unknown as Record<string, unknown>,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Goals DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
