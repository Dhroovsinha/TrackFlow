import prisma from "@/lib/prisma";

interface AuditLogEntry {
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  beforeValue?: Record<string, unknown> | null;
  afterValue?: Record<string, unknown> | null;
  ipAddress?: string;
  userAgent?: string;
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        entityType: entry.entityType,
        entityId: entry.entityId,
        action: entry.action,
        beforeValue: entry.beforeValue ? JSON.stringify(entry.beforeValue) : null,
        afterValue: entry.afterValue ? JSON.stringify(entry.afterValue) : null,
        ipAddress: entry.ipAddress,
        userAgent: entry.userAgent,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

export async function auditGoalChange(
  userId: string, goalId: string, action: string,
  before: Record<string, unknown> | null, after: Record<string, unknown> | null
): Promise<void> {
  return createAuditLog({ userId, entityType: "Goal", entityId: goalId, action, beforeValue: before, afterValue: after });
}

export async function auditSheetChange(
  userId: string, sheetId: string, action: string,
  before: Record<string, unknown> | null, after: Record<string, unknown> | null
): Promise<void> {
  return createAuditLog({ userId, entityType: "GoalSheet", entityId: sheetId, action, beforeValue: before, afterValue: after });
}
