import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role;
    if (role !== "ADMIN" && role !== "MANAGER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const cycleId = searchParams.get("cycleId");
    const departmentId = searchParams.get("departmentId");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 500);

    // Build where clause with optional filters
    const where: Record<string, unknown> = {};
    if (cycleId) where.sheet = { ...((where.sheet as Record<string, unknown>) || {}), cycleId };
    if (departmentId) where.user = { departmentId };

    // For managers, scope to their team only
    if (role === "MANAGER") {
      const teamIds = (await prisma.user.findMany({
        where: { managerId: session.user.id },
        select: { id: true },
      })).map(u => u.id);
      where.userId = { in: [session.user.id, ...teamIds] };
    }

    const [goals, total] = await Promise.all([
      prisma.goal.findMany({
        where,
        include: {
          user: { select: { name: true, email: true, department: { select: { name: true } } } },
          quarterlyUpdates: { orderBy: { createdAt: "desc" }, take: 1 },
          sheet: { select: { status: true, cycle: { select: { name: true, year: true } } } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.goal.count({ where }),
    ]);

    const reportData = goals.map((g) => {
      const latestUpdate = g.quarterlyUpdates[0];
      return {
        employeeName: g.user.name,
        employeeEmail: g.user.email,
        department: g.user.department.name,
        cycleName: g.sheet.cycle?.name || "N/A",
        cycleYear: g.sheet.cycle?.year || 0,
        thrustArea: g.thrustArea,
        goalTitle: g.title,
        uom: g.uom,
        target: g.target,
        weightage: g.weightage,
        achievement: latestUpdate?.achievement || 0,
        progress: latestUpdate?.progress || 0,
        status: g.status,
        sheetStatus: g.sheet.status,
      };
    });

    return NextResponse.json({ reportData, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Reports error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
