import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role;
    if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const entityType = searchParams.get("entityType");
    const action = searchParams.get("action");
    const userId = searchParams.get("userId");

    const where: Record<string, unknown> = {};
    if (entityType) where.entityType = entityType;
    if (action) where.action = action;
    if (userId) where.userId = userId;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { name: true, email: true, role: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    // Parse JSON strings for afterValue/beforeValue
    const parsedLogs = logs.map((log) => ({
      ...log,
      afterValue: log.afterValue ? (() => { try { return JSON.parse(log.afterValue); } catch { return log.afterValue; } })() : null,
      beforeValue: log.beforeValue ? (() => { try { return JSON.parse(log.beforeValue); } catch { return log.beforeValue; } })() : null,
    }));

    return NextResponse.json({ logs: parsedLogs, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("Audit GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
