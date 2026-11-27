import { Category, QuarterConfig, Task } from "./types";

// Approximate week distribution for a 52-week year
export const QUARTERS: QuarterConfig[] = [
  {
    name: "Q1",
    months: [
      { name: "Jan", weeks: 4, quarter: "Q1" },
      { name: "Feb", weeks: 4, quarter: "Q1" },
      { name: "Mar", weeks: 5, quarter: "Q1" },
    ],
  },
  {
    name: "Q2",
    months: [
      { name: "Apr", weeks: 4, quarter: "Q2" },
      { name: "May", weeks: 4, quarter: "Q2" },
      { name: "Jun", weeks: 5, quarter: "Q2" },
    ],
  },
  {
    name: "Q3",
    months: [
      { name: "Jul", weeks: 4, quarter: "Q3" },
      { name: "Aug", weeks: 4, quarter: "Q3" },
      { name: "Sep", weeks: 5, quarter: "Q3" },
    ],
  },
  {
    name: "Q4",
    months: [
      { name: "Oct", weeks: 4, quarter: "Q4" },
      { name: "Nov", weeks: 4, quarter: "Q4" },
      { name: "Dec", weeks: 5, quarter: "Q4" },
    ],
  },
];

export const TOTAL_WEEKS = 52;
export const MIN_DURATION_WEEKS = 2;

export const STORAGE_KEYS = {
  TASKS: "roadmap_tasks",
  CATEGORIES: "roadmap_categories",
};

export const INITIAL_CATEGORIES: Category[] = [
  { id: "frontend", name: "Frontend", color: "bg-blue-100 border-blue-300 text-blue-800" },
  { id: "backend", name: "Backend", color: "bg-emerald-100 border-emerald-300 text-emerald-800" },
  { id: "design", name: "Design", color: "bg-purple-100 border-purple-300 text-purple-800" },
  { id: "marketing", name: "Marketing", color: "bg-amber-100 border-amber-300 text-amber-800" },
];

export const INITIAL_TASKS: Task[] = [
  {
    id: "1",
    name: "User Authentication",
    description: "Implement OAuth2 and Email login flows.",
    category: "backend",
    startWeek: 2,
    durationWeeks: 3,
  },
  {
    id: "2",
    name: "Dashboard UI",
    description: "High fidelity implementation of main dashboard.",
    category: "frontend",
    startWeek: 4,
    durationWeeks: 4,
  },
  {
    id: "3",
    name: "Design System",
    description: "Create core components in Figma.",
    category: "design",
    startWeek: 1,
    durationWeeks: 6,
  },
  {
    id: "4",
    name: "Q1 Launch Campaign",
    description: "Prepare social media assets.",
    category: "marketing",
    startWeek: 10,
    durationWeeks: 4,
  }
];