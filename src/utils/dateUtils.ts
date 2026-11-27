import { QUARTERS, TOTAL_WEEKS } from "../constants";

const MONTHS = QUARTERS.flatMap((q) => q.months);

/**
 * Position of `date` on the roadmap grid, in weeks from the start (0..52).
 *
 * The grid draws months with a fixed number of week columns (4-4-5 per quarter),
 * so we locate the calendar month first and then interpolate by day within that
 * month's columns. This keeps the "today" line inside the correct month label.
 */
export const getGridWeekPosition = (date: Date = new Date()): number => {
  const month = date.getMonth();
  const daysInMonth = new Date(date.getFullYear(), month + 1, 0).getDate();
  const msIntoDay =
    date.getHours() * 3_600_000 +
    date.getMinutes() * 60_000 +
    date.getSeconds() * 1000;
  const monthFraction = (date.getDate() - 1 + msIntoDay / 86_400_000) / daysInMonth;

  const weeksBefore = MONTHS.slice(0, month).reduce((sum, m) => sum + m.weeks, 0);
  return weeksBefore + monthFraction * MONTHS[month].weeks;
};

/** 1-based grid week column containing `date` (1..52). */
export const getCurrentWeek = (date: Date = new Date()): number =>
  Math.max(1, Math.min(TOTAL_WEEKS, Math.floor(getGridWeekPosition(date)) + 1));

/** Horizontal position of `date` across the grid, as a percentage (0..100). */
export const getCurrentTimePercentage = (date: Date = new Date()): number =>
  Math.max(0, Math.min(100, (getGridWeekPosition(date) / TOTAL_WEEKS) * 100));
