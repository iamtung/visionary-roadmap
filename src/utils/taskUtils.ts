import { MIN_DURATION_WEEKS, TOTAL_WEEKS } from "../constants";

const toInt = (value: unknown, fallback: number): number => {
  const n = Math.round(Number(value));
  return Number.isFinite(n) ? n : fallback;
};

/**
 * Clamps a task's timing so it always fits inside the 52-week grid:
 * duration in [MIN_DURATION_WEEKS, TOTAL_WEEKS], start in [1, TOTAL_WEEKS - duration + 1].
 */
export const normalizeTaskTiming = <T extends { startWeek: unknown; durationWeeks: unknown }>(
  task: T
): T & { startWeek: number; durationWeeks: number } => {
  const durationWeeks = Math.max(
    MIN_DURATION_WEEKS,
    Math.min(TOTAL_WEEKS, toInt(task.durationWeeks, MIN_DURATION_WEEKS))
  );
  const startWeek = Math.max(
    1,
    Math.min(TOTAL_WEEKS - durationWeeks + 1, toInt(task.startWeek, 1))
  );
  return { ...task, startWeek, durationWeeks };
};

export const generateId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2, 11);
