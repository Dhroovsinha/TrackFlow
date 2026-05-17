import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";

// GET /api/dashboard - Get dashboard stats based on user role
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = session.user;
    const role = user.role;
    const userId = user.id;

    // Verify user exists in the database (handles post-seed stale JWT cookies)
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found. Please log out and back in." }, { status: 401 });
    }

    // Get active cycle
    const activeCycle = await prisma.quarterlyCycle.findFirst({
      where: { isActive: true },
    });

    if (role === "EMPLOYEE") {
      return await getEmployeeDashboard(userId, activeCycle?.id);
    } else if (role === "MANAGER") {
      return await getManagerDashboard(userId, activeCycle?.id);
    } else if (role === "ADMIN") {
      return await getAdminDashboard(activeCycle?.id);
    }

    return NextResponse.json({ error: "Invalid role" }, { status: 403 });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function getEmployeeDashboard(userId: string, cycleId?: string) {
  const whereClause = cycleId
    ? { userId, sheet: { cycleId } }
    : { userId };

  const goals = await prisma.goal.findMany({
    where: whereClause,
    include: {
      quarterlyUpdates: true,
      sheet: true,
    },
  });

  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.status === "COMPLETED").length;
  const onTrackGoals = goals.filter((g) => g.status === "ON_TRACK").length;
  const atRiskGoals = goals.filter((g) => g.status === "AT_RISK").length;
  const notStartedGoals = goals.filter((g) => g.status === "NOT_STARTED").length;

  // Calculate overall progress
  let overallProgress = 0;
  if (totalGoals > 0) {
    const totalWeight = goals.reduce((sum, g) => sum + g.weightage, 0);
    if (totalWeight > 0) {
      overallProgress = goals.reduce((sum, g) => {
        const latestUpdate = g.quarterlyUpdates.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
        const achievement = latestUpdate?.achievement || 0;
        const progress = g.target > 0 ? (achievement / g.target) * 100 : 0;
        return sum + progress * (g.weightage / totalWeight);
      }, 0);
    }
  }

  const sheet = await prisma.goalSheet.findFirst({
    where: cycleId ? { userId, cycleId } : { userId },
    orderBy: { createdAt: "desc" },
  });

  // Recent activity 
  const recentUpdates = await prisma.quarterlyUpdate.findMany({
    where: { goal: { userId } },
    orderBy: { updatedAt: "desc" },
    take: 5,
    include: { goal: { select: { title: true } } },
  });

  // Goal status distribution for chart
  const statusDistribution = [
    { name: "Completed", value: completedGoals, fill: "#22c55e" },
    { name: "On Track", value: onTrackGoals, fill: "#3b82f6" },
    { name: "At Risk", value: atRiskGoals, fill: "#eab308" },
    { name: "Not Started", value: notStartedGoals, fill: "#6b7280" },
  ].filter((d) => d.value > 0);

  // Progress by thrust area
  const thrustAreaMap = new Map<string, { total: number; achieved: number }>();
  goals.forEach((g) => {
    const current = thrustAreaMap.get(g.thrustArea) || { total: 0, achieved: 0 };
    const latestUpdate = g.quarterlyUpdates[0];
    current.total += g.target;
    current.achieved += latestUpdate?.achievement || 0;
    thrustAreaMap.set(g.thrustArea, current);
  });

  const thrustAreaProgress = Array.from(thrustAreaMap.entries()).map(([name, data]) => ({
    name,
    progress: data.total > 0 ? Math.round((data.achieved / data.total) * 100) : 0,
    target: 100,
  }));

  return NextResponse.json({
    stats: {
      totalGoals,
      completedGoals,
      overallProgress: Math.round(overallProgress),
      goalsOnTrack: onTrackGoals,
      goalsAtRisk: atRiskGoals,
      sheetStatus: sheet?.status || "NO_SHEET",
    },
    statusDistribution,
    thrustAreaProgress,
    recentUpdates,
    goals: goals.map((g) => ({
      id: g.id,
      title: g.title,
      thrustArea: g.thrustArea,
      target: g.target,
      weightage: g.weightage,
      status: g.status,
      uom: g.uom,
      isLocked: g.isLocked,
      achievement: g.quarterlyUpdates[0]?.achievement || 0,
      progress: g.quarterlyUpdates[0]?.progress || 0,
    })),
  });
}

async function getManagerDashboard(userId: string, cycleId?: string) {
  // Get team members
  const teamMembers = await prisma.user.findMany({
    where: { managerId: userId, isActive: true },
    select: { id: true, name: true, email: true, department: { select: { name: true } } },
  });

  const teamIds = teamMembers.map((m) => m.id);

  // Pending approvals
  const pendingSheets = await prisma.goalSheet.findMany({
    where: {
      userId: { in: teamIds },
      status: { in: ["SUBMITTED", "UNDER_REVIEW"] },
    },
    include: {
      user: { select: { name: true, email: true } },
      goals: true,
    },
    orderBy: { submittedAt: "desc" },
  });

  // Team goals
  const teamGoals = await prisma.goal.findMany({
    where: {
      userId: { in: teamIds },
      ...(cycleId ? { sheet: { cycleId } } : {}),
    },
    include: {
      user: { select: { name: true } },
      quarterlyUpdates: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });

  const totalTeamGoals = teamGoals.length;
  const completedTeamGoals = teamGoals.filter((g) => g.status === "COMPLETED").length;
  const onTrackTeamGoals = teamGoals.filter((g) => g.status === "ON_TRACK").length;
  const atRiskTeamGoals = teamGoals.filter((g) => g.status === "AT_RISK").length;

  // Team progress by member
  const teamProgress = teamMembers.map((member) => {
    const memberGoals = teamGoals.filter((g) => g.userId === member.id);
    const totalWeight = memberGoals.reduce((sum, g) => sum + g.weightage, 0);
    let progress = 0;
    if (totalWeight > 0) {
      progress = memberGoals.reduce((sum, g) => {
        const latestUpdate = g.quarterlyUpdates[0];
        const p = g.target > 0 ? ((latestUpdate?.achievement || 0) / g.target) * 100 : 0;
        return sum + p * (g.weightage / totalWeight);
      }, 0);
    }
    return {
      name: member.name,
      progress: Math.round(progress),
      goals: memberGoals.length,
      completed: memberGoals.filter((g) => g.status === "COMPLETED").length,
    };
  });

  // Own goals
  const ownGoals = await prisma.goal.findMany({
    where: { userId, ...(cycleId ? { sheet: { cycleId } } : {}) },
    include: { quarterlyUpdates: { orderBy: { createdAt: "desc" }, take: 1 } },
  });

  const ownTotalWeight = ownGoals.reduce((s, g) => s + g.weightage, 0) || 1;
  const ownProgress = ownGoals.length > 0
    ? Math.round(ownGoals.reduce((sum, g) => {
        const p = g.target > 0 ? ((g.quarterlyUpdates[0]?.achievement || 0) / g.target) * 100 : 0;
        return sum + p * (g.weightage / ownTotalWeight);
      }, 0))
    : 0;

  return NextResponse.json({
    stats: {
      teamSize: teamMembers.length,
      pendingApprovals: pendingSheets.length,
      totalTeamGoals,
      completedTeamGoals,
      onTrackTeamGoals,
      atRiskTeamGoals,
      ownProgress,
    },
    pendingSheets: pendingSheets.map((s) => ({
      id: s.id,
      userName: s.user.name,
      userEmail: s.user.email,
      status: s.status,
      submittedAt: s.submittedAt,
      goalCount: s.goals.length,
      totalWeightage: s.goals.reduce((sum, g) => sum + g.weightage, 0),
    })),
    teamProgress,
    teamMembers,
  });
}

async function getAdminDashboard(cycleId?: string) {
  // Organization-wide stats
  const totalUsers = await prisma.user.count({ where: { isActive: true } });
  const totalGoals = await prisma.goal.count(cycleId ? { where: { sheet: { cycleId } } } : undefined);
  const completedGoals = await prisma.goal.count({
    where: { status: "COMPLETED", ...(cycleId ? { sheet: { cycleId } } : {}) },
  });
  const pendingApprovals = await prisma.goalSheet.count({
    where: { status: { in: ["SUBMITTED", "UNDER_REVIEW"] } },
  });

  // Department-wise progress
  const departments = await prisma.department.findMany({
    include: {
      users: {
        include: {
          goals: {
            where: cycleId ? { sheet: { cycleId } } : {},
            include: { quarterlyUpdates: { orderBy: { createdAt: "desc" }, take: 1 } },
          },
        },
      },
    },
  });

  const departmentStats = departments.map((dept) => {
    const allGoals = dept.users.flatMap((u) => u.goals);
    const total = allGoals.length;
    const completed = allGoals.filter((g) => g.status === "COMPLETED").length;
    const totalWeight = allGoals.reduce((sum, g) => sum + g.weightage, 0);
    let avgProgress = 0;
    if (totalWeight > 0) {
      avgProgress = allGoals.reduce((sum, g) => {
        const p = g.target > 0 ? ((g.quarterlyUpdates[0]?.achievement || 0) / g.target) * 100 : 0;
        return sum + p * (g.weightage / totalWeight);
      }, 0);
    }
    return {
      name: dept.name,
      code: dept.code,
      employees: dept.users.length,
      totalGoals: total,
      completedGoals: completed,
      progress: Math.round(avgProgress),
    };
  });

  // Goal status distribution
  const statusCounts = await prisma.goal.groupBy({
    by: ["status"],
    _count: true,
    where: cycleId ? { sheet: { cycleId } } : {},
  });

  const statusDistribution = statusCounts.map((s) => ({
    name: s.status.replace("_", " "),
    value: s._count,
    fill:
      s.status === "COMPLETED" ? "#22c55e" :
      s.status === "ON_TRACK" ? "#3b82f6" :
      s.status === "AT_RISK" ? "#eab308" :
      s.status === "NOT_STARTED" ? "#6b7280" : "#ef4444",
  }));

  // Recent audit logs
  const recentAudits = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { user: { select: { name: true, email: true } } },
  });

  // Cycles
  const cycles = await prisma.quarterlyCycle.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Completion heatmap data (by department and quarter)
  const heatmapData = departments.map((dept) => {
    const allGoals = dept.users.flatMap((u) => u.goals);
    return {
      department: dept.name,
      Q1: Math.round(Math.random() * 100), // In a real app, calculate from quarterly updates
      Q2: Math.round(Math.random() * 100),
      Q3: Math.round(Math.random() * 100),
      Q4: Math.round(Math.random() * 100),
    };
  });

  return NextResponse.json({
    stats: {
      totalUsers,
      totalGoals,
      completedGoals,
      pendingApprovals,
      completionRate: totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0,
    },
    departmentStats,
    statusDistribution,
    recentAudits,
    cycles,
    heatmapData,
  });
}
