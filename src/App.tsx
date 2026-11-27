import React, { useState, useRef, useEffect } from "react";
import {
  Plus,
  Layout,
  Settings,
  Search,
  Layers,
  Upload,
  FileText,
  Image,
  ChevronDown,
  Moon,
  Sun,
  Trash2,
  ChevronUp,
} from "lucide-react";
import { RoadmapGrid } from "./components/roadmap/RoadmapGrid";
import { Button } from "./components/common/Button";
import { TaskFormModal } from "./components/roadmap/TaskFormModal";
import { ManageAreasModal } from "./components/roadmap/ManageAreasModal";
import { INITIAL_TASKS, INITIAL_CATEGORIES, STORAGE_KEYS } from "./constants";
import { Task, Category } from "./types";
import { getCurrentWeek, getCurrentTimePercentage } from "./utils/dateUtils";
import { parseTasksCSV } from "./utils/csvUtils";
import { generateId, normalizeTaskTiming } from "./utils/taskUtils";

import { useRoadmapData } from "./hooks/useRoadmapData";
import { useExport } from "./hooks/useExport";

const App: React.FC = () => {
  const {
    tasks,
    setTasks,
    categories,
    setCategories,
    addTask,
    updateTask,
    deleteTask,
    addCategory,
    updateCategory,
    deleteCategory,
  } = useRoadmapData();

  // View State
  const [showCurrentTime, setShowCurrentTime] = useState(false);
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isManageAreasOpen, setIsManageAreasOpen] = useState(false);

  // Edit/Create Task State
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskFormData, setTaskFormData] = useState<Omit<Task, "id">>({
    name: "",
    description: "",
    category: "frontend",
    startWeek: 1,
    durationWeeks: 4,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const { exportToPNG, exportToCSV } = useExport(tasks, isDarkMode);

  // Toggle Dark Mode
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setIsExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Time tracking state for "Current Time" feature
  const [currentWeek, setCurrentWeek] = useState(() => getCurrentWeek());
  const [currentTimePercentage, setCurrentTimePercentage] = useState(() =>
    getCurrentTimePercentage()
  );

  useEffect(() => {
    if (!showCurrentTime) return;

    const tick = () => {
      const now = new Date();
      setCurrentWeek(getCurrentWeek(now));
      setCurrentTimePercentage(getCurrentTimePercentage(now));
    };
    tick(); // refresh immediately when the indicator is turned on

    // Update time every minute
    const timer = setInterval(tick, 60000);

    return () => clearInterval(timer);
  }, [showCurrentTime]);

  // --- Task Handlers ---

  const handleOpenTaskModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
      setTaskFormData({
        name: task.name,
        description: task.description,
        category: task.category,
        startWeek: task.startWeek,
        durationWeeks: task.durationWeeks,
      });
    } else {
      setEditingTask(null);
      const defaultCat = categories.length > 0 ? categories[0].id : "";
      setTaskFormData({
        name: "",
        description: "",
        category: defaultCat,
        startWeek: 1,
        durationWeeks: 4,
      });
    }
    setIsModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();

    // Clamp so the task always ends within week 52
    const finalData = normalizeTaskTiming(taskFormData);

    if (editingTask) {
      updateTask({ ...editingTask, ...finalData });
    } else {
      addTask({ id: generateId(), ...finalData });
    }
    setIsModalOpen(false);
  };

  const handleDeleteTask = (id: string) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      deleteTask(id);
    }
  };

  // --- Manage Area Handlers (Inside Modal) ---

  const handleAddArea = () => {
    addCategory({
      id: generateId(),
      name: "New Area",
      color: "bg-slate-100 border-slate-300 text-slate-800",
    });
  };

  const handleUpdateAreaName = (id: string, name: string) => {
    const cat = categories.find((c) => c.id === id);
    if (cat) updateCategory({ ...cat, name });
  };

  const handleMoveArea = (index: number, direction: number) => {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= categories.length) return;

    const newCategories = [...categories];
    const [moved] = newCategories.splice(index, 1);
    newCategories.splice(newIndex, 0, moved);
    setCategories(newCategories);
  };

  const handleDeleteCategory = (id: string) => {
    const hasTasks = tasks.some((t) => t.category === id);
    if (hasTasks) {
      if (
        !window.confirm(
          "This area contains tasks. Deleting it will also delete all associated tasks. Continue?"
        )
      ) {
        return;
      }
    }
    deleteCategory(id);
  };

  // --- Import/Export Handlers ---

  const handleExportImage = () => {
    setIsExportMenuOpen(false);
    exportToPNG("roadmap-container");
  };

  const handleExportCSV = () => {
    setIsExportMenuOpen(false);
    exportToCSV();
  };

  const handleImportClick = () => {
    setIsExportMenuOpen(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const { tasks: newTasks, skipped } = parseTasksCSV(text);

        // Never wipe existing data with an empty/invalid import
        if (newTasks.length === 0) {
          alert(
            `No valid tasks found in the file${
              skipped ? ` (${skipped} invalid rows skipped)` : ""
            }. Your current roadmap was not changed.`
          );
          return;
        }

        const skippedNote = skipped ? `\n${skipped} invalid rows will be skipped.` : "";
        if (
          !window.confirm(
            `Replace your current ${tasks.length} tasks with ${newTasks.length} imported tasks?${skippedNote}`
          )
        ) {
          return;
        }

        // Create areas for categories that don't exist yet, so imported tasks stay visible
        const knownIds = new Set(categories.map((c) => c.id));
        const missingCategories: Category[] = [];
        for (const t of newTasks) {
          if (!knownIds.has(t.category)) {
            knownIds.add(t.category);
            missingCategories.push({
              id: t.category,
              name: t.category,
              color: "bg-slate-100 border-slate-300 text-slate-800",
            });
          }
        }
        if (missingCategories.length > 0) {
          setCategories([...categories, ...missingCategories]);
        }

        setTasks(newTasks);
        alert(
          `Imported ${newTasks.length} tasks.` +
            (missingCategories.length
              ? `\nCreated ${missingCategories.length} new area(s): ${missingCategories
                  .map((c) => c.name)
                  .join(", ")}.`
              : "")
        );
      } catch (error) {
        console.error("Import error:", error);
        alert(
          `Failed to import CSV: ${
            error instanceof Error ? error.message : "unknown error"
          }. Your current roadmap was not changed.`
        );
      } finally {
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    reader.readAsText(file);
  };

  // --- Shared Styles ---

  return (
    <div className="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept=".csv"
        className="hidden"
      />

      {/* Top Navigation */}
      <header className="flex-none h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-6 flex items-center justify-between z-20 shadow-sm transition-colors duration-200">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-sm shadow-indigo-200 dark:shadow-none">
            <Layout className="text-white w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
              Visionary Roadmap
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Q1 - Q4 {new Date().getFullYear()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Search Box */}
          <div className="relative group hidden md:block">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-transparent dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900 outline-none transition-all w-64 placeholder:text-slate-400"
            />
          </div>

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden md:block" />

          {/* Manage Areas Button */}
          <Button
            variant="ghost"
            icon={
              <Layers
                size={16}
                className="text-indigo-600 dark:text-indigo-400"
              />
            }
            onClick={() => setIsManageAreasOpen(true)}
            className="hidden sm:flex dark:text-slate-300 dark:hover:bg-slate-800"
            title="Manage Areas"
          >
            Areas
          </Button>

          {/* New Task Button */}
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => handleOpenTaskModal()}
          >
            New Task
          </Button>

          {/* Import/Export Dropdown */}
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
              className="ml-2 flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:text-slate-900 rounded-lg transition-colors text-sm font-medium shadow-sm"
            >
              Import/Export
              <ChevronDown
                size={14}
                className={`transition-transform duration-200 ${
                  isExportMenuOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isExportMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="py-1">
                  <button
                    onClick={handleImportClick}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Upload size={14} className="text-slate-400" />
                    Import from CSV
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <FileText size={14} className="text-slate-400" />
                    Export to CSV
                  </button>
                  <div className="h-px bg-slate-100 dark:bg-slate-700 my-1" />
                  <button
                    onClick={handleExportImage}
                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Image size={14} className="text-slate-400" />
                    Export to PNG
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow overflow-hidden flex flex-col">
        <div
          id="roadmap-container"
          className="h-full flex flex-col relative bg-white dark:bg-slate-900 transition-colors duration-200"
        >
          <RoadmapGrid
            tasks={tasks}
            categories={categories}
            showCurrentTime={showCurrentTime}
            currentWeek={currentWeek}
            currentTimePercentage={currentTimePercentage}
            searchQuery={searchQuery}
            onDeleteTask={handleDeleteTask}
            onEditTask={handleOpenTaskModal}
            onUpdateTask={updateTask}
            onEditCategory={() => setIsManageAreasOpen(true)}
            onDeleteCategory={handleDeleteCategory}
            onReorderCategories={setCategories}
          />
        </div>
      </main>

      {/* Footer / Status Bar */}
      <footer className="flex-none h-12 bg-white dark:bg-slate-900 border-t border-gray-200 dark:border-slate-800 px-6 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 transition-colors duration-200">
        <div className="flex items-center gap-4">
          <span>{tasks.length} tasks total</span>
          <span>•</span>
          <span>Last updated: just now</span>
          {showCurrentTime && <span>•</span>}
          {showCurrentTime && (
            <span className="text-amber-600 dark:text-amber-400 font-medium">
              Week {currentWeek}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Current Time Toggle (Moved to Footer) */}
          <div
            className="flex items-center gap-2 cursor-pointer select-none"
            onClick={() => setShowCurrentTime(!showCurrentTime)}
            title="Toggle Current Time Indicator"
          >
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
              Current Time
            </span>
            <div
              className={`w-9 h-5 rounded-full relative transition-colors duration-200 ${
                showCurrentTime
                  ? "bg-amber-500"
                  : "bg-slate-200 dark:bg-slate-700"
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  showCurrentTime ? "left-[18px]" : "left-0.5"
                }`}
              />
            </div>
          </div>

          <div className="h-4 w-px bg-slate-200 dark:bg-slate-700 mx-1" />

          {/* Dark Mode Toggle */}
          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors text-slate-500 dark:text-slate-400"
            title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
          </button>
        </div>
      </footer>

      <TaskFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isEditing={!!editingTask}
        editingTaskId={editingTask?.id}
        formData={taskFormData}
        setFormData={setTaskFormData}
        categories={categories}
        onSave={handleSaveTask}
        onDelete={deleteTask}
      />

      {/* Manage Areas Modal */}
      <ManageAreasModal
        isOpen={isManageAreasOpen}
        onClose={() => setIsManageAreasOpen(false)}
        categories={categories}
        onAddCategory={handleAddArea}
        onUpdateCategoryName={handleUpdateAreaName}
        onReorderCategories={setCategories}
        onDeleteCategory={handleDeleteCategory}
      />
    </div>
  );
};

export default App;
