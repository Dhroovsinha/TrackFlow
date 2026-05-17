import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // All authenticated users can view cycles (employees need active cycle for goal sheet creation)

    const cycles = await prisma.quarterlyCycle.findMany({ orderBy: { startDate: "desc" } });
    return NextResponse.json({ cycles });
  } catch (error) {
    console.error("Cycles GET error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role;
    if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const data = await req.json();
    const cycle = await prisma.quarterlyCycle.create({
      data: {
        name: data.name,
        year: data.year,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        phase: data.phase || "GOAL_SETTING",
        isActive: data.isActive || false,
      },
    });

    if (data.isActive) {
      await prisma.quarterlyCycle.updateMany({ where: { id: { not: cycle.id } }, data: { isActive: false } });
    }

    return NextResponse.json({ cycle }, { status: 201 });
  } catch (error) {
    console.error("Cycles POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = session.user.role;
    if (role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id, ...data } = await req.json();
    const cycle = await prisma.quarterlyCycle.update({
      where: { id },
      data: {
        ...data,
        ...(data.startDate ? { startDate: new Date(data.startDate) } : {}),
        ...(data.endDate ? { endDate: new Date(data.endDate) } : {}),
      },
    });

    if (data.isActive) {
      await prisma.quarterlyCycle.updateMany({ where: { id: { not: id } }, data: { isActive: false } });
    }

    return NextResponse.json({ cycle });
  } catch (error) {
    console.error("Cycles PUT error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
