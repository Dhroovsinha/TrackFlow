import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Clean existing data
  await prisma.auditLog.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.approvalHistory.deleteMany();
  await prisma.quarterlyUpdate.deleteMany();
  await prisma.goal.deleteMany();
  await prisma.goalSheet.deleteMany();
  await prisma.sharedGoal.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.verificationToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.quarterlyCycle.deleteMany();
  await prisma.department.deleteMany();

  console.log("✓ Cleaned existing data");

  // Create departments
  const departments = await Promise.all([
    prisma.department.create({ data: { name: "Engineering", code: "ENG" } }),
    prisma.department.create({ data: { name: "Product", code: "PRD" } }),
    prisma.department.create({ data: { name: "Marketing", code: "MKT" } }),
    prisma.department.create({ data: { name: "Human Resources", code: "HR" } }),
    prisma.department.create({ data: { name: "Finance", code: "FIN" } }),
    prisma.department.create({ data: { name: "Sales", code: "SLS" } }),
  ]);
  console.log("✓ Created departments");

  const hash = (pwd: string) => bcrypt.hashSync(pwd, 10);

  // Create admin
  const admin = await prisma.user.create({
    data: {
      name: "Ananya Patel",
      email: "admin@atomquest.com",
      password: hash("admin123"),
      role: "ADMIN",
      departmentId: departments[3].id,
    },
  });

  // Create managers
  const managers = await Promise.all([
    prisma.user.create({ data: { name: "Rajesh Kumar", email: "rajesh.kumar@atomquest.com", password: hash("demo123"), role: "MANAGER", departmentId: departments[0].id } }),
    prisma.user.create({ data: { name: "Meera Nair", email: "meera.nair@atomquest.com", password: hash("demo123"), role: "MANAGER", departmentId: departments[1].id } }),
    prisma.user.create({ data: { name: "Vikram Singh", email: "vikram.singh@atomquest.com", password: hash("demo123"), role: "MANAGER", departmentId: departments[2].id } }),
    prisma.user.create({ data: { name: "Deepa Menon", email: "deepa.menon@atomquest.com", password: hash("demo123"), role: "MANAGER", departmentId: departments[4].id } }),
  ]);
  console.log("✓ Created managers");

  // Create employees
  const employees = await Promise.all([
    prisma.user.create({ data: { name: "Priya Sharma", email: "priya.sharma@atomquest.com", password: hash("demo123"), role: "EMPLOYEE", departmentId: departments[0].id, managerId: managers[0].id } }),
    prisma.user.create({ data: { name: "Arjun Reddy", email: "arjun.reddy@atomquest.com", password: hash("demo123"), role: "EMPLOYEE", departmentId: departments[0].id, managerId: managers[0].id } }),
    prisma.user.create({ data: { name: "Kavita Joshi", email: "kavita.joshi@atomquest.com", password: hash("demo123"), role: "EMPLOYEE", departmentId: departments[0].id, managerId: managers[0].id } }),
    prisma.user.create({ data: { name: "Rahul Gupta", email: "rahul.gupta@atomquest.com", password: hash("demo123"), role: "EMPLOYEE", departmentId: departments[1].id, managerId: managers[1].id } }),
    prisma.user.create({ data: { name: "Sneha Iyer", email: "sneha.iyer@atomquest.com", password: hash("demo123"), role: "EMPLOYEE", departmentId: departments[1].id, managerId: managers[1].id } }),
    prisma.user.create({ data: { name: "Aditya Verma", email: "aditya.verma@atomquest.com", password: hash("demo123"), role: "EMPLOYEE", departmentId: departments[2].id, managerId: managers[2].id } }),
    prisma.user.create({ data: { name: "Pooja Mishra", email: "pooja.mishra@atomquest.com", password: hash("demo123"), role: "EMPLOYEE", departmentId: departments[2].id, managerId: managers[2].id } }),
    prisma.user.create({ data: { name: "Siddharth Das", email: "sid.das@atomquest.com", password: hash("demo123"), role: "EMPLOYEE", departmentId: departments[4].id, managerId: managers[3].id } }),
    prisma.user.create({ data: { name: "Nisha Kaur", email: "nisha.kaur@atomquest.com", password: hash("demo123"), role: "EMPLOYEE", departmentId: departments[5].id, managerId: managers[0].id } }),
    prisma.user.create({ data: { name: "Rohan Mehta", email: "rohan.mehta@atomquest.com", password: hash("demo123"), role: "EMPLOYEE", departmentId: departments[0].id, managerId: managers[0].id } }),
  ]);
  console.log("✓ Created employees");

  // Create quarterly cycle
  const cycle = await prisma.quarterlyCycle.create({
    data: {
      name: "FY 2025-26",
      year: 2025,
      startDate: new Date("2025-04-01"),
      endDate: new Date("2026-03-31"),
      isActive: true,
      phase: "Q1_REVIEW",
    },
  });
  console.log("✓ Created quarterly cycle");

  // Goals data for different employees
  const goalSets = [
    {
      userId: employees[0].id,
      status: "APPROVED" as const,
      goals: [
        { thrustArea: "Innovation & Technology", title: "Implement CI/CD Pipeline", description: "Set up automated CI/CD pipeline with GitHub Actions for all microservices with >95% test coverage", uom: "PERCENTAGE" as const, target: 95, weightage: 25, status: "ON_TRACK" as const, achievement: 72 },
        { thrustArea: "Operational Excellence", title: "Reduce API Response Time", description: "Optimize database queries and API endpoints to achieve p99 latency under 200ms", uom: "NUMERIC" as const, target: 200, weightage: 20, status: "ON_TRACK" as const, achievement: 180 },
        { thrustArea: "Quality Assurance", title: "Zero Critical Bugs in Production", description: "Maintain zero critical severity bugs in production environment through improved testing", uom: "ZERO_BASED" as const, target: 0, weightage: 20, status: "COMPLETED" as const, achievement: 0 },
        { thrustArea: "People & Culture", title: "Mentor Junior Developers", description: "Conduct weekly 1:1 mentoring sessions with 3 junior developers and complete knowledge transfer", uom: "NUMERIC" as const, target: 48, weightage: 15, status: "ON_TRACK" as const, achievement: 32 },
        { thrustArea: "Revenue Growth", title: "Deliver Payment Integration", description: "Complete end-to-end payment gateway integration with Razorpay supporting UPI, cards, and net banking", uom: "PERCENTAGE" as const, target: 100, weightage: 20, status: "ON_TRACK" as const, achievement: 85 },
      ],
    },
    {
      userId: employees[1].id,
      status: "APPROVED" as const,
      goals: [
        { thrustArea: "Innovation & Technology", title: "Kubernetes Migration", description: "Migrate 5 core services from EC2 to EKS with zero downtime deployment strategy", uom: "NUMERIC" as const, target: 5, weightage: 30, status: "ON_TRACK" as const, achievement: 3 },
        { thrustArea: "Cost Optimization", title: "Reduce Cloud Costs", description: "Optimize AWS infrastructure to achieve 25% cost reduction through right-sizing and reserved instances", uom: "PERCENTAGE" as const, target: 25, weightage: 25, status: "AT_RISK" as const, achievement: 12 },
        { thrustArea: "Quality Assurance", title: "Increase Test Coverage", description: "Improve unit and integration test coverage from 65% to 90% across all services", uom: "PERCENTAGE" as const, target: 90, weightage: 25, status: "ON_TRACK" as const, achievement: 78 },
        { thrustArea: "Compliance & Governance", title: "SOC2 Compliance", description: "Complete SOC2 Type II compliance audit requirements for engineering systems", uom: "PERCENTAGE" as const, target: 100, weightage: 20, status: "NOT_STARTED" as const, achievement: 15 },
      ],
    },
    {
      userId: employees[3].id,
      status: "APPROVED" as const,
      goals: [
        { thrustArea: "Customer Satisfaction", title: "Improve NPS Score", description: "Increase Net Promoter Score from 42 to 65 through product improvements and user research", uom: "NUMERIC" as const, target: 65, weightage: 30, status: "ON_TRACK" as const, achievement: 55 },
        { thrustArea: "Innovation & Technology", title: "Launch AI Features", description: "Ship 3 AI-powered product features including smart search, recommendations, and auto-categorization", uom: "NUMERIC" as const, target: 3, weightage: 25, status: "ON_TRACK" as const, achievement: 2 },
        { thrustArea: "Revenue Growth", title: "Reduce Churn Rate", description: "Decrease monthly churn rate from 5.2% to 3% through retention improvements", uom: "PERCENTAGE" as const, target: 3, weightage: 25, status: "AT_RISK" as const, achievement: 4.1 },
        { thrustArea: "Market Expansion", title: "Mobile App Launch", description: "Launch React Native mobile app on iOS and Android with feature parity", uom: "PERCENTAGE" as const, target: 100, weightage: 20, status: "ON_TRACK" as const, achievement: 70 },
      ],
    },
    {
      userId: employees[5].id,
      status: "APPROVED" as const,
      goals: [
        { thrustArea: "Revenue Growth", title: "Increase MQLs", description: "Generate 500 Marketing Qualified Leads per month through content marketing and SEO", uom: "NUMERIC" as const, target: 500, weightage: 30, status: "COMPLETED" as const, achievement: 520 },
        { thrustArea: "Market Expansion", title: "Social Media Growth", description: "Grow LinkedIn followers from 5K to 25K and Twitter from 2K to 10K", uom: "NUMERIC" as const, target: 25000, weightage: 25, status: "ON_TRACK" as const, achievement: 18500 },
        { thrustArea: "Customer Satisfaction", title: "Brand Awareness Survey", description: "Achieve 40% unaided brand awareness in target market segment", uom: "PERCENTAGE" as const, target: 40, weightage: 25, status: "ON_TRACK" as const, achievement: 28 },
        { thrustArea: "Cost Optimization", title: "Reduce CAC", description: "Reduce Customer Acquisition Cost from $120 to $80 through organic channel optimization", uom: "NUMERIC" as const, target: 80, weightage: 20, status: "ON_TRACK" as const, achievement: 95 },
      ],
    },
    {
      userId: employees[2].id,
      status: "SUBMITTED" as const,
      goals: [
        { thrustArea: "Innovation & Technology", title: "GraphQL Migration", description: "Migrate REST APIs to GraphQL for improved frontend data fetching efficiency", uom: "PERCENTAGE" as const, target: 100, weightage: 30, status: "NOT_STARTED" as const, achievement: 0 },
        { thrustArea: "Operational Excellence", title: "Improve Uptime", description: "Achieve 99.95% uptime SLA for all production services", uom: "PERCENTAGE" as const, target: 99.95, weightage: 25, status: "NOT_STARTED" as const, achievement: 0 },
        { thrustArea: "People & Culture", title: "Tech Blog Posts", description: "Publish 12 technical blog posts on engineering best practices", uom: "NUMERIC" as const, target: 12, weightage: 20, status: "NOT_STARTED" as const, achievement: 0 },
        { thrustArea: "Quality Assurance", title: "Performance Testing", description: "Implement load testing framework and benchmark all critical paths", uom: "PERCENTAGE" as const, target: 100, weightage: 25, status: "NOT_STARTED" as const, achievement: 0 },
      ],
    },
  ];

  for (const goalSet of goalSets) {
    const sheet = await prisma.goalSheet.create({
      data: {
        userId: goalSet.userId,
        cycleId: cycle.id,
        status: goalSet.status,
        submittedAt: new Date("2025-05-15"),
        ...(goalSet.status === "APPROVED" ? { approvedAt: new Date("2025-05-20") } : {}),
      },
    });

    for (const [i, g] of goalSet.goals.entries()) {
      const goal = await prisma.goal.create({
        data: {
          sheetId: sheet.id,
          userId: goalSet.userId,
          thrustArea: g.thrustArea,
          title: g.title,
          description: g.description,
          uom: g.uom,
          target: g.target,
          weightage: g.weightage,
          status: g.status,
          isLocked: goalSet.status === "APPROVED",
          sortOrder: i,
        },
      });

      if (goalSet.status === "APPROVED" && g.achievement > 0) {
        const progress = g.uom === "ZERO_BASED"
          ? (g.achievement === 0 ? 100 : 0)
          : g.target > 0 ? Math.round((g.achievement / g.target) * 100) : 0;

        await prisma.quarterlyUpdate.create({
          data: {
            goalId: goal.id,
            cycleId: cycle.id,
            quarter: "Q1",
            achievement: g.achievement,
            status: g.status,
            progress,
            submittedAt: new Date("2025-07-10"),
          },
        });
      }

      if (goalSet.status === "APPROVED") {
        await prisma.approvalHistory.create({
          data: {
            goalId: goal.id,
            reviewerId: managers[0].id,
            action: "APPROVED",
            comments: "Looks good. Approved.",
          },
        });
      }
    }
  }
  console.log("✓ Created goal sheets and goals with quarterly updates");

  // Create audit logs
  const auditActions = [
    { userId: employees[0].id, entityType: "GoalSheet", action: "CREATE" as const, afterValue: { status: "DRAFT" } },
    { userId: employees[0].id, entityType: "Goal", action: "CREATE" as const, afterValue: { title: "Implement CI/CD Pipeline" } },
    { userId: employees[0].id, entityType: "GoalSheet", action: "SUBMIT" as const, afterValue: { status: "SUBMITTED" } },
    { userId: managers[0].id, entityType: "GoalSheet", action: "APPROVE" as const, afterValue: { status: "APPROVED" } },
    { userId: employees[0].id, entityType: "QuarterlyUpdate", action: "UPDATE" as const, afterValue: { quarter: "Q1", achievement: 72 } },
    { userId: employees[1].id, entityType: "GoalSheet", action: "CREATE" as const, afterValue: { status: "DRAFT" } },
    { userId: employees[1].id, entityType: "GoalSheet", action: "SUBMIT" as const, afterValue: { status: "SUBMITTED" } },
    { userId: managers[0].id, entityType: "GoalSheet", action: "APPROVE" as const, afterValue: { status: "APPROVED" } },
    { userId: admin.id, entityType: "QuarterlyCycle", action: "CREATE" as const, afterValue: { name: "FY 2025-26" } },
    { userId: admin.id, entityType: "QuarterlyCycle", action: "UPDATE" as const, afterValue: { phase: "Q1_REVIEW" } },
    { userId: employees[3].id, entityType: "Goal", action: "CREATE" as const, afterValue: { title: "Improve NPS Score" } },
    { userId: managers[1].id, entityType: "GoalSheet", action: "APPROVE" as const, afterValue: { status: "APPROVED" } },
    { userId: employees[5].id, entityType: "QuarterlyUpdate", action: "UPDATE" as const, afterValue: { quarter: "Q1", achievement: 520 } },
    { userId: admin.id, entityType: "Goal", action: "UNLOCK" as const, afterValue: { isLocked: false } },
  ];

  for (const [i, log] of auditActions.entries()) {
    await prisma.auditLog.create({
      data: {
        userId: log.userId,
        entityType: log.entityType,
        entityId: `demo-entity-${i}`,
        action: log.action,
        afterValue: JSON.stringify(log.afterValue),
        createdAt: new Date(Date.now() - (auditActions.length - i) * 3600000),
      },
    });
  }
  console.log("✓ Created audit logs");

  // Create comments
  await prisma.comment.createMany({
    data: [
      { goalId: (await prisma.goal.findFirst({ where: { title: "Implement CI/CD Pipeline" } }))!.id, userId: managers[0].id, content: "Great progress on the CI/CD setup. Make sure to include staging environment in the pipeline.", type: "CHECKIN", quarter: "Q1" },
      { goalId: (await prisma.goal.findFirst({ where: { title: "Reduce API Response Time" } }))!.id, userId: managers[0].id, content: "Consider implementing Redis caching for frequently accessed endpoints.", type: "FEEDBACK", quarter: "Q1" },
      { goalId: (await prisma.goal.findFirst({ where: { title: "Improve NPS Score" } }))!.id, userId: managers[1].id, content: "NPS improvement is on track. Keep focusing on the onboarding experience.", type: "CHECKIN", quarter: "Q1" },
    ],
  });
  console.log("✓ Created comments");

  console.log("\n✅ Seed complete! Demo accounts:");
  console.log("  Employee: priya.sharma@atomquest.com / demo123");
  console.log("  Manager:  rajesh.kumar@atomquest.com / demo123");
  console.log("  Admin:    admin@atomquest.com / admin123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
