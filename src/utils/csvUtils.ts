import { Task } from "../types";

export const generateTasksCSV = (tasks: Task[]): string => {
  const headers = [
    "id",
    "name",
    "description",
    "category",
    "startWeek",
    "durationWeeks",
  ];
  const rows = tasks.map((t) =>
    [
      t.id,
      `"${t.name.replace(/"/g, '""')}"`,
      `"${t.description.replace(/"/g, '""')}"`,
      t.category,
      t.startWeek,
      t.durationWeeks,
    ].join(",")
  );
  return [headers.join(","), ...rows].join("\n");
};

export const parseTasksCSV = (csvText: string): Task[] => {
  const lines = csvText.split("\n");
  const headers = lines[0].split(",");

  if (headers.length < 5) throw new Error("Invalid CSV format");

  const newTasks: Task[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/);

    if (cols.length >= 6) {
      newTasks.push({
        id: cols[0].trim(),
        name: cols[1].trim().replace(/^"|"$/g, "").replace(/""/g, '"'),
        description: cols[2]
          .trim()
          .replace(/^"|"$/g, "")
          .replace(/""/g, '"'),
        category: cols[3].trim(),
        startWeek: parseInt(cols[4].trim()),
        durationWeeks: parseInt(cols[5].trim()),
      });
    }
  }
  return newTasks;
};
