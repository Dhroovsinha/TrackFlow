import { z } from "zod";

// Goal creation schema
export const goalSchema = z.object({
  thrustArea: z.string().min(1, "Thrust area is required"),
  title: z.string().min(3, "Title must be at least 3 characters").max(200, "Title must be under 200 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(2000, "Description must be under 2000 characters"),
  uom: z.enum(["NUMERIC", "PERCENTAGE", "TIMELINE", "ZERO_BASED"], {
    message: "Unit of measurement is required",
  }),
  target: z.number().min(0, "Target must be non-negative"),
  weightage: z.number().min(10, "Minimum weightage is 10%").max(100, "Maximum weightage is 100%"),
  deadline: z.string().optional(),
});

// Goal sheet submission validation
export const goalSheetSchema = z.object({
  goals: z.array(goalSchema)
    .min(1, "At least one goal is required")
    .max(8, "Maximum 8 goals allowed")
    .refine(
      (goals) => {
        const total = goals.reduce((sum, g) => sum + g.weightage, 0);
        return Math.abs(total - 100) < 0.01;
      },
      { message: "Total weightage must equal 100%" }
    ),
});

// Quarterly update schema
export const quarterlyUpdateSchema = z.object({
  achievement: z.number().min(0, "Achievement cannot be negative"),
  status: z.enum(["NOT_STARTED", "ON_TRACK", "COMPLETED"], {
    message: "Status is required",
  }),
  notes: z.string().max(2000).optional(),
});

// Manager approval schema
export const approvalSchema = z.object({
  action: z.enum(["APPROVED", "REJECTED", "RETURNED"]),
  comments: z.string().optional(),
  inlineEdits: z.array(z.object({
    goalId: z.string(),
    target: z.number().optional(),
    weightage: z.number().min(10).max(100).optional(),
  })).optional(),
});

// Check-in comment schema
export const checkinSchema = z.object({
  content: z.string().min(1, "Comment is required").max(2000),
  quarter: z.enum(["Q1", "Q2", "Q3", "Q4"]),
  goalId: z.string(),
});

// Shared goal schema
export const sharedGoalSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  uom: z.enum(["NUMERIC", "PERCENTAGE", "TIMELINE", "ZERO_BASED"]),
  target: z.number().min(0),
  thrustArea: z.string().min(1),
  assignedUserIds: z.array(z.string()).min(1, "Assign to at least one employee"),
});

// Cycle schema
export const cycleSchema = z.object({
  name: z.string().min(1),
  year: z.number().int().min(2020).max(2030),
  startDate: z.string(),
  endDate: z.string(),
  phase: z.enum(["GOAL_SETTING", "Q1_REVIEW", "Q2_REVIEW", "Q3_REVIEW", "Q4_REVIEW", "CLOSED"]),
});

// Login schema
export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export type GoalFormData = z.infer<typeof goalSchema>;
export type GoalSheetFormData = z.infer<typeof goalSheetSchema>;
export type QuarterlyUpdateFormData = z.infer<typeof quarterlyUpdateSchema>;
export type ApprovalFormData = z.infer<typeof approvalSchema>;
export type CheckinFormData = z.infer<typeof checkinSchema>;
export type SharedGoalFormData = z.infer<typeof sharedGoalSchema>;
export type CycleFormData = z.infer<typeof cycleSchema>;
export type LoginFormData = z.infer<typeof loginSchema>;
