/**
 * Progress Calculation Engine
 * 
 * Rules:
 * 1. NUMERIC (Higher is better): progress = achievement / target
 * 2. PERCENTAGE: progress = achievement / target  
 * 3. TIMELINE: completion based on deadline proximity
 * 4. ZERO_BASED: if value == 0 → 100%, else → 0%
 */

export function calculateProgress(
  uom: string,
  target: number,
  achievement: number,
  deadline?: Date | null
): number {
  switch (uom) {
    case "NUMERIC":
      return calculateNumericProgress(target, achievement);
    case "PERCENTAGE":
      return calculatePercentageProgress(target, achievement);
    case "TIMELINE":
      return calculateTimelineProgress(deadline);
    case "ZERO_BASED":
      return calculateZeroBasedProgress(achievement);
    default:
      return 0;
  }
}

function calculateNumericProgress(target: number, achievement: number): number {
  if (target === 0) return achievement >= 0 ? 100 : 0;
  if (target < 0 || achievement < 0) return 0;
  return clamp((achievement / target) * 100, 0, 150);
}

function calculatePercentageProgress(target: number, achievement: number): number {
  if (target === 0) return achievement >= 0 ? 100 : 0;
  if (target < 0 || achievement < 0) return 0;
  return clamp((achievement / target) * 100, 0, 150);
}

function calculateTimelineProgress(deadline?: Date | null): number {
  if (!deadline) return 0;
  const now = new Date();
  const deadlineDate = new Date(deadline);
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const totalDuration = deadlineDate.getTime() - startOfYear.getTime();
  const elapsed = now.getTime() - startOfYear.getTime();
  if (totalDuration <= 0) return 100;
  if (now >= deadlineDate) return 100;
  return clamp((elapsed / totalDuration) * 100, 0, 100);
}

function calculateZeroBasedProgress(achievement: number): number {
  return achievement === 0 ? 100 : 0;
}

function clamp(value: number, min: number, max: number): number {
  if (isNaN(value) || !isFinite(value)) return 0;
  return Math.min(Math.max(value, min), max);
}

export function calculateSheetProgress(
  goals: Array<{ weightage: number; uom: string; target: number; achievement: number; deadline?: Date | null }>
): number {
  if (goals.length === 0) return 0;
  let weightedSum = 0;
  let totalWeight = 0;
  for (const goal of goals) {
    const progress = calculateProgress(goal.uom, goal.target, goal.achievement, goal.deadline);
    weightedSum += progress * (goal.weightage / 100);
    totalWeight += goal.weightage;
  }
  if (totalWeight === 0) return 0;
  return clamp((weightedSum / (totalWeight / 100)), 0, 150);
}

export function getProgressColor(progress: number): string {
  if (progress >= 100) return "text-green-500";
  if (progress >= 75) return "text-blue-500";
  if (progress >= 50) return "text-yellow-500";
  if (progress >= 25) return "text-orange-500";
  return "text-red-500";
}

export function getProgressBarColor(progress: number): string {
  if (progress >= 100) return "bg-green-500";
  if (progress >= 75) return "bg-blue-500";
  if (progress >= 50) return "bg-yellow-500";
  if (progress >= 25) return "bg-orange-500";
  return "bg-red-500";
}
