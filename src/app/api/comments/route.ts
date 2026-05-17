import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { goalId, content, type, quarter } = await req.json();
    const comment = await prisma.comment.create({
      data: { goalId, userId: session.user.id, content, type: type || "NOTE", quarter },
      include: { user: { select: { name: true } } },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (error) {
    console.error("Comments POST error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
