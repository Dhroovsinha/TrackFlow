import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Upsert departments
  const engDept = await prisma.department.upsert({
    where: { code: "ENG" },
    update: {},
    create: { name: "Engineering", code: "ENG" },
  });
  const prdDept = await prisma.department.upsert({
    where: { code: "PRD" },
    update: {},
    create: { name: "Product", code: "PRD" },
  });
  const hrDept = await prisma.department.upsert({
    where: { code: "HR" },
    update: {},
    create: { name: "Human Resources", code: "HR" },
  });
  console.log("✓ Upserted departments");

  const hash = (pwd: string) => bcrypt.hashSync(pwd, 10);

  // Upsert Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@atomquest.com" },
    update: {},
    create: {
      name: "Ananya Patel",
      email: "admin@atomquest.com",
      password: hash("admin123"),
      role: "ADMIN",
      departmentId: hrDept.id,
      isActive: true,
    },
  });

  // Upsert Manager
  const manager = await prisma.user.upsert({
    where: { email: "rajesh.kumar@atomquest.com" },
    update: {},
    create: {
      name: "Rajesh Kumar",
      email: "rajesh.kumar@atomquest.com",
      password: hash("demo123"),
      role: "MANAGER",
      departmentId: engDept.id,
      isActive: true,
    },
  });

  // Upsert Employee
  const employee = await prisma.user.upsert({
    where: { email: "priya.sharma@atomquest.com" },
    update: {},
    create: {
      name: "Priya Sharma",
      email: "priya.sharma@atomquest.com",
      password: hash("demo123"),
      role: "EMPLOYEE",
      departmentId: engDept.id,
      managerId: manager.id,
      isActive: true,
    },
  });
  console.log("✓ Upserted demo users");

  // Upsert Quarterly Cycle
  // We can't strictly upsert without a unique field on name/year natively, but let's assume we search first
  let cycle = await prisma.quarterlyCycle.findFirst({
    where: { name: "FY 2025-26" },
  });
  
  if (!cycle) {
    cycle = await prisma.quarterlyCycle.create({
      data: {
        name: "FY 2025-26",
        year: 2025,
        startDate: new Date("2025-04-01"),
        endDate: new Date("2026-03-31"),
        isActive: true,
        phase: "Q1_REVIEW",
      },
    });
  }
  console.log("✓ Ensured quarterly cycle exists");

  // Upsert GoalSheet for Employee
  let goalSheet = await prisma.goalSheet.findFirst({
    where: { userId: employee.id, cycleId: cycle.id },
  });

  if (!goalSheet) {
    goalSheet = await prisma.goalSheet.create({
      data: {
        userId: employee.id,
        cycleId: cycle.id,
        status: "APPROVED",
      },
    });

    // Create Goals
    const goal1 = await prisma.goal.create({
      data: {
        sheetId: goalSheet.id,
        userId: employee.id,
        thrustArea: "Innovation & Technology",
        title: "Implement CI/CD Pipeline",
        description: "Set up automated CI/CD pipeline",
        uom: "PERCENTAGE",
        target: 100,
        weightage: 50,
        status: "ON_TRACK",
      },
    });

    // Create Quarterly Updates
    await prisma.quarterlyUpdate.create({
      data: {
        goalId: goal1.id,
        cycleId: cycle.id,
        quarter: "Q1",
        achievement: 75,
        notes: "Pipeline is 75% complete",
        status: "REVIEWED",
      },
    });

    // Create Audit Logs
    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        entityType: "GOAL_SHEET",
        entityId: goalSheet.id,
        action: "GOAL_SHEET_APPROVED",
        ipAddress: "127.0.0.1",
      },
    });

    // Create Manager Comments
    await prisma.comment.create({
      data: {
        goalId: goal1.id,
        userId: manager.id,
        content: "Good progress on the CI/CD pipeline.",
      },
    });
    
    console.log("✓ Created goals and updates");
  } else {
    console.log("✓ Goals already exist for demo user");
  }

  console.log("✅ Idempotent seed complete! Demo accounts:");
  console.log("  Employee: priya.sharma@atomquest.com / demo123");
  console.log("  Manager:  rajesh.kumar@atomquest.com / demo123");
  console.log("  Admin:    admin@atomquest.com / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
