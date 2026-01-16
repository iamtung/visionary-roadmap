export interface Task {
  id: string;
  name: string;
  description: string;
  category: string;
  startWeek: number; // 1-52
  durationWeeks: number;
}

export interface Category {
  id: string;
  name: string;
  color: string;
}

export interface MonthConfig {
  name: string;
  weeks: number; // Number of weeks to display for this month
  quarter: string;
}

export type QuarterConfig = {
  name: string;
  months: MonthConfig[];
}