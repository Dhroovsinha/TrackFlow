import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding rich enterprise data...");

  const hash = (pwd: string) => bcrypt.hashSync(pwd, 10);

  // 1. Upsert Departments
  const departmentsData = [
    { name: "Engineering", code: "ENG" },
    { name: "Product", code: "PRD" },
    { name: "Marketing", code: "MKT" },
    { name: "Human Resources", code: "HR" },
    { name: "Finance", code: "FIN" },
    { name: "Sales", code: "SLS" },
  ];

  const depts: Record<string, any> = {};
  for (const d of departmentsData) {
    depts[d.code] = await prisma.department.upsert({
      where: { code: d.code },
      update: {},
      create: d,
    });
  }
  console.log("✓ Upserted departments");

  // 2. Upsert Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@atomquest.com" },
    update: {},
    create: {
      name: "Ananya Patel",
      email: "admin@atomquest.com",
      password: hash("admin123"),
      role: "ADMIN",
      departmentId: depts["HR"].id,
      isActive: true,
    },
  });

  // 3. Upsert Managers
  const managersData = [
    { name: "Rajesh Kumar", email: "rajesh.kumar@atomquest.com", dept: "ENG" },
    { name: "Meera Nair", email: "meera.nair@atomquest.com", dept: "PRD" },
    { name: "Vikram Singh", email: "vikram.singh@atomquest.com", dept: "SLS" },
    { name: "Deepa Menon", email: "deepa.menon@atomquest.com", dept: "FIN" },
  ];

  const managers: Record<string, any> = {};
  for (const m of managersData) {
    managers[m.email] = await prisma.user.upsert({
      where: { email: m.email },
      update: {},
      create: {
        name: m.name,
        email: m.email,
        password: hash("demo123"),
        role: "MANAGER",
        departmentId: depts[m.dept].id,
        isActive: true,
      },
    });
  }
  console.log("✓ Upserted managers");

  // 4. Upsert Employees
  const employeesData = [
    { name: "Priya Sharma", email: "priya.sharma@atomquest.com", dept: "ENG", mgr: "rajesh.kumar@atomquest.com" },
    { name: "Arjun Reddy", email: "arjun.reddy@atomquest.com", dept: "ENG", mgr: "rajesh.kumar@atomquest.com" },
    { name: "Kavita Joshi", email: "kavita.joshi@atomquest.com", dept: "ENG", mgr: "rajesh.kumar@atomquest.com" },
    { name: "Rahul Gupta", email: "rahul.gupta@atomquest.com", dept: "PRD", mgr: "meera.nair@atomquest.com" },
    { name: "Sneha Iyer", email: "sneha.iyer@atomquest.com", dept: "PRD", mgr: "meera.nair@atomquest.com" },
    { name: "Aditya Verma", email: "aditya.verma@atomquest.com", dept: "SLS", mgr: "vikram.singh@atomquest.com" },
    { name: "Pooja Mishra", email: "pooja.mishra@atomquest.com", dept: "SLS", mgr: "vikram.singh@atomquest.com" },
    { name: "Siddharth Das", email: "sid.das@atomquest.com", dept: "FIN", mgr: "deepa.menon@atomquest.com" },
  ];

  const employees: any[] = [];
  for (const e of employeesData) {
    const emp = await prisma.user.upsert({
      where: { email: e.email },
      update: {},
      create: {
        name: e.name,
        email: e.email,
        password: hash("demo123"),
        role: "EMPLOYEE",
        departmentId: depts[e.dept].id,
        managerId: managers[e.mgr].id,
        isActive: true,
      },
    });
    employees.push(emp);
  }
  console.log("✓ Upserted employees");

  // 5. Upsert Cycle
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

  // 6. Upsert Shared Goals
  const sharedGoal1 = await prisma.sharedGoal.findFirst({ where: { title: "Company Wide Revenue Target" } });
  let sg1Id = sharedGoal1?.id;
  if (!sg1Id) {
    const sg = await prisma.sharedGoal.create({
      data: {
        title: "Company Wide Revenue Target",
        description: "Achieve $10M ARR by end of FY",
        uom: "CURRENCY",
        target: 10000000,
        thrustArea: "Revenue Growth",
        createdById: admin.id,
      },
    });
    sg1Id = sg.id;
  }

  // 7. Generate Rich Goal Sheets & Data
  let dataGenerated = 0;
  for (const emp of employees) {
    let sheet = await prisma.goalSheet.findFirst({
      where: { userId: emp.id, cycleId: cycle.id },
    });

    if (!sheet) {
      // Create Sheet
      const isPriya = emp.email === "priya.sharma@atomquest.com";
      const isRahul = emp.email === "rahul.gupta@atomquest.com";
      const isSneha = emp.email === "sneha.iyer@atomquest.com";
      const sheetStatus = isRahul ? "RETURNED" : isSneha ? "SUBMITTED" : "APPROVED";

      sheet = await prisma.goalSheet.create({
        data: {
          userId: emp.id,
          cycleId: cycle.id,
          status: sheetStatus,
          submittedAt: new Date("2025-04-10"),
          approvedAt: sheetStatus === "APPROVED" ? new Date("2025-04-15") : null,
          returnedAt: sheetStatus === "RETURNED" ? new Date("2025-04-12") : null,
          comments: sheetStatus === "RETURNED" ? "Please revise the targets for Q2." : null,
        },
      });

      // Approval History (Only if not SUBMITTED, since SUBMITTED is pending)
      if (sheetStatus !== "SUBMITTED") {
        await prisma.approvalHistory.create({
          data: {
            reviewerId: emp.managerId!,
            action: sheetStatus === "APPROVED" ? "APPROVED" : "RETURNED",
            comments: sheetStatus === "RETURNED" ? "Needs more ambitious targets." : "Looks good.",
          },
        });
      }

      // Goals
      const goalsList = isPriya ? [
        { thrustArea: "Innovation", title: "Implement CI/CD Pipeline", uom: "PERCENTAGE", target: 100, weight: 30, status: "COMPLETED", ach: 100, sharedId: null },
        { thrustArea: "Quality", title: "Zero Critical Bugs", uom: "ZERO_BASED", target: 0, weight: 20, status: "ON_TRACK", ach: 0, sharedId: null },
        { thrustArea: "Revenue", title: "Support Enterprise Deals", uom: "CURRENCY", target: 500000, weight: 30, status: "AT_RISK", ach: 120000, sharedId: sg1Id },
        { thrustArea: "People", title: "Mentor Junior Devs", uom: "NUMERIC", target: 10, weight: 20, status: "ON_TRACK", ach: 6, sharedId: null },
      ] : [
        { thrustArea: "Operations", title: "Optimize Workflows", uom: "PERCENTAGE", target: 100, weight: 40, status: "ON_TRACK", ach: 60, sharedId: null },
        { thrustArea: "Growth", title: "Increase User Retention", uom: "PERCENTAGE", target: 80, weight: 60, status: "OVERDUE", ach: 30, sharedId: null },
      ];

      for (const gData of goalsList) {
        const goal = await prisma.goal.create({
          data: {
            sheetId: sheet.id,
            userId: emp.id,
            thrustArea: gData.thrustArea,
            title: gData.title,
            description: "Detailed description for " + gData.title,
            uom: gData.uom,
            target: gData.target,
            weightage: gData.weight,
            status: gData.status,
            sharedGoalId: gData.sharedId,
          },
        });

        // Updates
        if (gData.ach > 0 || gData.status === "COMPLETED") {
          await prisma.quarterlyUpdate.create({
            data: {
              goalId: goal.id,
              cycleId: cycle.id,
              quarter: "Q1",
              achievement: gData.ach,
              notes: "Progress looks solid so far.",
              status: "REVIEWED",
              progress: (gData.ach / (gData.target === 0 ? 1 : gData.target)) * 100,
            },
          });
        }

        // Comments
        if (gData.status === "AT_RISK" || gData.status === "OVERDUE") {
          await prisma.comment.create({
            data: {
              goalId: goal.id,
              userId: emp.managerId!,
              content: "We need to discuss roadblocks here during our next 1:1.",
            },
          });
        }
      }

      // Audit Log for Sheet
      await prisma.auditLog.create({
        data: {
          userId: emp.id,
          entityType: "GOAL_SHEET",
          entityId: sheet.id,
          action: "GOAL_SHEET_SUBMITTED",
          ipAddress: "127.0.0.1",
        },
      });

      dataGenerated++;
    }
  }
  
  if (dataGenerated > 0) {
    console.log(`✓ Generated rich enterprise data for ${dataGenerated} employees`);
  } else {
    console.log("✓ Enterprise data already exists, skipping generation to maintain idempotency.");
  }

  console.log("✅ Seed complete! Dashboards and Analytics should now be fully populated.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
