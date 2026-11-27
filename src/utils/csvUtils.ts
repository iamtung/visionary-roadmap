import { Task } from "../types";
import { generateId, normalizeTaskTiming } from "./taskUtils";

const HEADERS = [
  "id",
  "name",
  "description",
  "category",
  "startWeek",
  "durationWeeks",
] as const;

const escapeField = (value: string | number): string =>
  `"${String(value).replace(/"/g, '""')}"`;

export const generateTasksCSV = (tasks: Task[]): string => {
  const rows = tasks.map((t) =>
    [t.id, t.name, t.description, t.category, t.startWeek, t.durationWeeks]
      .map(escapeField)
      .join(",")
  );
  return [HEADERS.join(","), ...rows].join("\r\n");
};

/**
 * RFC 4180 parser: handles quoted fields containing commas, escaped quotes
 * ("") and line breaks, plus CRLF/LF line endings and a leading BOM.
 */
export const parseCSV = (text: string): string[][] => {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  // Drop blank lines
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
};

export interface ParseTasksResult {
  tasks: Task[];
  skipped: number;
}

export const parseTasksCSV = (csvText: string): ParseTasksResult => {
  const [headerRow, ...dataRows] = parseCSV(csvText);
  if (!headerRow) throw new Error("CSV file is empty");

  const headers = headerRow.map((h) => h.trim());
  const index = Object.fromEntries(
    HEADERS.map((h) => [h, headers.indexOf(h)])
  ) as Record<(typeof HEADERS)[number], number>;

  const missing = HEADERS.filter((h) => h !== "id" && index[h] === -1);
  if (missing.length > 0) {
    throw new Error(`Missing columns: ${missing.join(", ")}`);
  }

  const tasks: Task[] = [];
  const seenIds = new Set<string>();
  let skipped = 0;

  for (const cols of dataRows) {
    const get = (h: (typeof HEADERS)[number]) =>
      index[h] === -1 ? "" : (cols[index[h]] ?? "").trim();

    const name = get("name");
    const category = get("category");
    const startWeek = Number(get("startWeek"));
    const durationWeeks = Number(get("durationWeeks"));

    if (
      !name ||
      !category ||
      !Number.isFinite(startWeek) ||
      !Number.isFinite(durationWeeks)
    ) {
      skipped++;
      continue;
    }

    let id = get("id");
    if (!id || seenIds.has(id)) {
      id = generateId();
    }
    seenIds.add(id);

    tasks.push(
      normalizeTaskTiming({
        id,
        name,
        description: cols[index.description] ?? "",
        category,
        startWeek,
        durationWeeks,
      })
    );
  }

  return { tasks, skipped };
};
