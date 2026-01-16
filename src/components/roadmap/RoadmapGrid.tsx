import React, { useState, useMemo, useRef, useEffect } from "react";
import { TOTAL_WEEKS } from "../../constants";
import { Task, Category } from "../../types";
import { Edit2, Trash2 } from "lucide-react";
import { useRoadmapDimensions } from "../../hooks/useRoadmapDimensions";
import { RoadmapHeader } from "./RoadmapHeader";

interface RoadmapGridProps {
  tasks: Task[];
  categories: Category[];
  showCurrentTime: boolean;
  currentWeek: number;
  searchQuery: string;
  onDeleteTask: (id: string) => void;
  onEditTask: (task: Task) => void;
  onUpdateTask: (task: Task) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  onReorderCategories: (categories: Category[]) => void;
}

interface DragState {
  taskId: string;
  mode: "MOVE" | "RESIZE";
  startMouseWeek: number;
  originalStartWeek: number;
  originalDuration: number;
  originalCategory: string;
}

export const RoadmapGrid: React.FC<RoadmapGridProps> = ({
  tasks,
  categories,
  showCurrentTime,
  currentWeek,
  searchQuery,
  onDeleteTask,
  onEditTask,
  onUpdateTask,
  onEditCategory,
  onDeleteCategory,
  onReorderCategories,
}) => {
  const [hoveredTask, setHoveredTask] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [tempTask, setTempTask] = useState<Task | null>(null);

  const timelineRef = useRef<HTMLDivElement>(null);
  const categoryRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const isDraggingRef = useRef(false);
  const ignoreClickRef = useRef(false);

  // Layout constants
  const LANE_HEIGHT = 100;
  const CARD_HEIGHT = 80;
  const CARD_GAP = 12;
  const MIN_ROW_HEIGHT = 140;
  const MIN_DURATION_WEEKS = 2; // Minimum duration for card display

  const { weekWeights, cumulativeFr, totalFr, gridTemplateColumns, allMonths } =
    useRoadmapDimensions();

  // --- Grid Coordinate System Logic ---

  const getWeekFromClientX = (clientX: number) => {
    if (!timelineRef.current) return 1;
    const rect = timelineRef.current.getBoundingClientRect();
    const relativeX = clientX - rect.left;

    // Clamp within the grid container
    const clampedX = Math.max(0, Math.min(rect.width, relativeX));
    const progress = clampedX / rect.width;
    const targetFr = progress * totalFr;

    // Find the week index where cumulative Fr exceeds target Fr
    let week = 1;
    for (let i = 1; i < cumulativeFr.length; i++) {
      if (targetFr <= cumulativeFr[i]) {
        week = i;
        break;
      }
    }
    return week;
  };

  // 2. Calculate accurate position % for current time line
  const currentTimePercentage = useMemo(() => {
    if (!showCurrentTime) return 0;

    let accumulatedFr = 0;
    // Add up full weeks before current
    if (currentWeek > 1) {
      accumulatedFr =
        cumulativeFr[Math.min(currentWeek - 1, cumulativeFr.length - 1)];
    }

    // Add half of current week to center the line
    if (currentWeek >= 1 && currentWeek <= weekWeights.length) {
      accumulatedFr += weekWeights[currentWeek - 1] / 2;
    }

    return (accumulatedFr / totalFr) * 100;
  }, [showCurrentTime, currentWeek, cumulativeFr, weekWeights, totalFr]);

  // Merge real tasks with the temporary task being dragged/resized for live updates
  const displayTasks = useMemo(() => {
    if (!tempTask) return tasks;
    return tasks.map((t) => (t.id === tempTask.id ? tempTask : t));
  }, [tasks, tempTask]);

  // Calculate layout (stacking) for each category
  const categoryLayouts = useMemo(() => {
    const layouts: Record<
      string,
      { laneMap: Map<string, number>; laneCount: number }
    > = {};

    categories.forEach((cat) => {
      const catTasks = displayTasks.filter((t) => t.category === cat.id);
      const sorted = [...catTasks].sort((a, b) => a.startWeek - b.startWeek);
      const lanes: number[] = [];
      const laneMap = new Map<string, number>();

      sorted.forEach((task) => {
        let laneIndex = -1;
        for (let i = 0; i < lanes.length; i++) {
          // Check if task fits in this lane (start week >= previous task end week)
          if (task.startWeek >= lanes[i]) {
            laneIndex = i;
            break;
          }
        }
        if (laneIndex === -1) {
          laneIndex = lanes.length;
          lanes.push(0);
        }
        laneMap.set(task.id, laneIndex);
        lanes[laneIndex] = task.startWeek + task.durationWeeks;
      });

      layouts[cat.id] = { laneMap, laneCount: Math.max(1, lanes.length) };
    });
    return layouts;
  }, [displayTasks, categories]);

  // Calculate synchronized Area Name Font Size
  const commonAreaNameFontSize = useMemo(() => {
    const names = categories.map((c) => c.name);
    const maxLen = Math.max(0, ...names.map((n) => n.length));

    if (maxLen > 25) return "text-sm font-medium";
    if (maxLen > 15) return "text-base font-semibold";
    return "text-xl font-bold";
  }, [categories]);

  // --- Task Mouse Event Handlers ---
  const handleMouseDown = (
    e: React.MouseEvent,
    task: Task,
    mode: "MOVE" | "RESIZE"
  ) => {
    e.stopPropagation();
    if (!timelineRef.current) return;

    // Calculate accurate starting week index based on mouse position
    const startMouseWeek = getWeekFromClientX(e.clientX);

    isDraggingRef.current = false;

    setDragState({
      taskId: task.id,
      mode,
      startMouseWeek,
      originalStartWeek: Number(task.startWeek) || 1,
      originalDuration: Number(task.durationWeeks) || 1,
      originalCategory: task.category,
    });
    setTempTask(task);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState || !tempTask) return;

      const currentMouseWeek = getWeekFromClientX(e.clientX);
      const deltaWeeks = currentMouseWeek - dragState.startMouseWeek;

      // Detect intention to drag
      if (!isDraggingRef.current && deltaWeeks !== 0) {
        isDraggingRef.current = true;
      }

      if (dragState.mode === "MOVE") {
        let newStart = dragState.originalStartWeek + deltaWeeks;
        // Clamp start week
        newStart = Math.max(
          1,
          Math.min(newStart, TOTAL_WEEKS - dragState.originalDuration + 1)
        );

        let newCategory = tempTask.category;
        const mouseY = e.clientY;

        for (const [catId, el] of categoryRefs.current.entries()) {
          const rect = el.getBoundingClientRect();
          if (mouseY >= rect.top && mouseY <= rect.bottom) {
            newCategory = catId;
            break;
          }
        }

        if (
          newStart !== tempTask.startWeek ||
          newCategory !== tempTask.category
        ) {
          setTempTask({
            ...tempTask,
            startWeek: newStart,
            category: newCategory,
          });
        }
      } else if (dragState.mode === "RESIZE") {
        // For resize, we calculate new duration based on where the mouse is now vs where we started
        let newDuration = dragState.originalDuration + deltaWeeks;
        // Clamp duration with minimum of MIN_DURATION_WEEKS
        newDuration = Math.max(
          MIN_DURATION_WEEKS,
          Math.min(newDuration, TOTAL_WEEKS - tempTask.startWeek + 1)
        );

        if (newDuration !== tempTask.durationWeeks) {
          setTempTask({ ...tempTask, durationWeeks: newDuration });
        }
      }
    };

    const handleMouseUp = () => {
      if (dragState && tempTask) {
        if (isDraggingRef.current) {
          // Only update if something actually changed
          if (
            tempTask.startWeek !== dragState.originalStartWeek ||
            tempTask.durationWeeks !== dragState.originalDuration ||
            tempTask.category !== dragState.originalCategory
          ) {
            onUpdateTask(tempTask);
          }
          ignoreClickRef.current = true;
        }
      }

      setDragState(null);
      setTempTask(null);
      isDraggingRef.current = false;

      setTimeout(() => {
        ignoreClickRef.current = false;
      }, 50);
    };

    if (dragState) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor =
        dragState.mode === "RESIZE" ? "ew-resize" : "grabbing";
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "unset";
    };
  }, [dragState, tempTask, onUpdateTask, categories, totalFr, cumulativeFr]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 select-none transition-colors duration-200">
      {/* Header Section */}
      <RoadmapHeader allMonths={allMonths} />

      {/* Body Section */}
      <div className="flex-grow overflow-auto relative flex flex-col isolate">
        {/* Layer 0: Grid Background (Months only) & Current Time Line */}
        <div
          ref={timelineRef}
          className="absolute inset-0 pointer-events-none left-40 right-0 h-full z-0 grid grid-cols-[repeat(52,minmax(0,1fr))]"
          style={{ width: "calc(100% - 10rem)" }}
        >
          {/* Render month columns spanning their weeks */}
          {allMonths.map((month, i) => (
            <div
              key={i}
              className="border-r border-slate-100 dark:border-slate-800/40 h-full"
              style={{
                gridColumn: `span ${month.weeks} / span ${month.weeks}`,
              }}
            />
          ))}

          {/* Current Time Vertical Line */}
          {showCurrentTime && (
            <div
              className="absolute top-0 bottom-0 w-[2px] bg-amber-500/50 dark:bg-amber-500/70 pointer-events-none shadow-[0_0_8px_rgba(245,158,11,0.3)]"
              style={{ left: `${currentTimePercentage}%` }}
            />
          )}
        </div>

        {/* Layer 10: Task Content */}
        <div className="relative z-10 flex flex-col w-full flex-grow">
          {categories.map((category, index) => {
            const catTasks = displayTasks.filter(
              (t) => t.category === category.id
            );
            const layout = categoryLayouts[category.id] || {
              laneMap: new Map(),
              laneCount: 1,
            };

            const contentHeight =
              layout.laneCount * CARD_HEIGHT +
              (layout.laneCount - 1) * CARD_GAP;
            const minSectionHeight = Math.max(
              MIN_ROW_HEIGHT,
              contentHeight + 24
            );
            const startY = (minSectionHeight - contentHeight) / 2;

            return (
              <div
                key={category.id}
                ref={(el) => {
                  if (el) categoryRefs.current.set(category.id, el);
                }}
                className="flex border-b border-gray-100 dark:border-slate-800 relative group/row bg-transparent flex-1 w-full"
                style={{ minHeight: minSectionHeight }}
              >
                {/* Category Label Column */}
                <div className="w-40 flex-shrink-0 border-r border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-center py-2 shadow-[1px_0_0_rgba(0,0,0,0.03)] h-full transition-colors duration-200 z-20">
                  <div className="flex-1 flex items-center justify-center px-2 rounded mx-1">
                    <div
                      className={`${commonAreaNameFontSize} text-slate-700 dark:text-slate-300 text-center leading-tight break-words w-full`}
                    >
                      {category.name}
                    </div>
                  </div>
                </div>

                {/* Task Swimlane - Uses Weighted Grid Columns */}
                <div
                  className="flex-grow grid relative z-10"
                  style={{ gridTemplateColumns }}
                >
                  {catTasks.map((task) => {
                    const laneIndex = layout.laneMap.get(task.id) || 0;
                    const topPos =
                      startY + laneIndex * (CARD_HEIGHT + CARD_GAP);

                    const isHovered = hoveredTask === task.id;
                    const isDragging = dragState?.taskId === task.id;

                    const isMatch =
                      !searchQuery ||
                      task.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase()) ||
                      task.description
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase());

                    const isSearchActive = !!searchQuery;
                    const isActiveTime =
                      showCurrentTime &&
                      currentWeek >= task.startWeek &&
                      currentWeek < task.startWeek + task.durationWeeks;

                    let baseClasses = "";
                    if (isSearchActive && isMatch) {
                      baseClasses =
                        "bg-indigo-50 dark:bg-indigo-950 border-indigo-400 dark:border-indigo-700 text-indigo-900 dark:text-indigo-100 ring-1 ring-indigo-400 dark:ring-indigo-700 shadow-md";
                    } else if (isActiveTime && !isSearchActive) {
                      baseClasses =
                        "bg-amber-50 dark:bg-amber-950 border-amber-400 dark:border-amber-700 text-amber-900 dark:text-amber-100 ring-1 ring-amber-400 dark:ring-amber-700 shadow-md";
                    } else {
                      baseClasses =
                        "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-600";
                    }

                    const opacityClass = isMatch
                      ? "opacity-100"
                      : "opacity-25 grayscale dark:opacity-20";

                    // Calculate font size class based on duration (for auto-fitting text)
                    const getTaskNameFontClass = (duration: number): string => {
                      // Larger cards get larger fonts, smaller cards get smaller fonts
                      if (duration >= 8) return "text-lg"; // max font size
                      if (duration >= 5) return "text-base";
                      if (duration >= 3) return "text-sm";
                      return "text-xs"; // smallest for narrow cards
                    };

                    const taskNameFontClass = getTaskNameFontClass(
                      task.durationWeeks
                    );

                    const safeStart = Number(task.startWeek) || 1;
                    // Ensure minimum duration of MIN_DURATION_WEEKS for display
                    const safeDuration = Math.max(
                      Number(task.durationWeeks) || MIN_DURATION_WEEKS,
                      MIN_DURATION_WEEKS
                    );

                    // Calculate percentage-based position and width
                    // Since all weeks have equal weight (1fr each), we can use simple percentages
                    const leftPercent = ((safeStart - 1) / TOTAL_WEEKS) * 100;
                    const widthPercent = (safeDuration / TOTAL_WEEKS) * 100;

                    return (
                      <div
                        key={task.id}
                        className={`
                        absolute rounded-md border px-4 py-3 pr-8 shadow-sm 
                        transition-all duration-200 ease-out
                        flex flex-col justify-center overflow-hidden
                        ${baseClasses} ${opacityClass}
                        ${
                          isDragging
                            ? "z-50 shadow-xl ring-2 ring-indigo-500 scale-[1.02] cursor-grabbing opacity-90"
                            : "cursor-grab"
                        }
                        ${
                          isHovered && !isDragging && !isActiveTime && isMatch
                            ? "shadow-md ring-1 ring-black/5 dark:ring-white/10 z-30 -translate-y-[1px]"
                            : "z-10"
                        }
                      `}
                        style={{
                          left: `${leftPercent}%`,
                          width: `${widthPercent}%`,
                          top: topPos,
                          height: CARD_HEIGHT,
                          transitionProperty: isDragging ? "none" : "all",
                        }}
                        onMouseDown={(e) => handleMouseDown(e, task, "MOVE")}
                        onMouseEnter={() => setHoveredTask(task.id)}
                        onMouseLeave={() => setHoveredTask(null)}
                        onClick={(e) => {
                          if (ignoreClickRef.current) {
                            e.stopPropagation();
                            return;
                          }
                          onEditTask(task);
                        }}
                      >
                        {/* Text container - fills full height */}
                        <div className="flex items-center h-full w-full">
                          <div
                            className={`font-semibold ${taskNameFontClass} leading-snug pointer-events-none w-full ${
                              isActiveTime || (isSearchActive && isMatch)
                                ? "font-bold"
                                : ""
                            }`}
                            title={task.name}
                            style={{
                              display: "-webkit-box",
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: "vertical",
                              overflow: "hidden",
                              wordBreak: "break-word",
                            }}
                          >
                            {task.name}
                          </div>
                        </div>

                        {/* Resize Handle */}
                        {isMatch && (
                          <div
                            className="absolute top-0 bottom-0 right-0 w-3 cursor-ew-resize hover:bg-black/5 dark:hover:bg-white/10 flex items-center justify-center z-40 group/handle"
                            onMouseDown={(e) =>
                              handleMouseDown(e, task, "RESIZE")
                            }
                          >
                            <div className="h-4 w-1 bg-black/10 dark:bg-white/10 rounded-full group-hover/handle:bg-black/20 dark:group-hover/handle:bg-white/20" />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
