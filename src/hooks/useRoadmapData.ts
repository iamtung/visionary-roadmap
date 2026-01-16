import { useState, useEffect } from "react";
import { Task, Category } from "../types";
import { INITIAL_TASKS, INITIAL_CATEGORIES, STORAGE_KEYS } from "../constants";

export const useRoadmapData = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse tasks from localStorage", e);
      }
    }
    // If no data, use initial and save it immediately
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
    return INITIAL_TASKS;
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error("Failed to parse categories from localStorage", e);
      }
    }
    // If no data, use initial and save it immediately
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(INITIAL_CATEGORIES));
    return INITIAL_CATEGORIES;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
  }, [categories]);

  const addTask = (task: Task) => setTasks([...tasks, task]);
  const updateTask = (updatedTask: Task) =>
    setTasks(tasks.map((t) => (t.id === updatedTask.id ? updatedTask : t)));
  const deleteTask = (id: string) =>
    setTasks(tasks.filter((t) => t.id !== id));

  const addCategory = (category: Category) =>
    setCategories([...categories, category]);
  const updateCategory = (updatedCategory: Category) =>
    setCategories(
      categories.map((c) => (c.id === updatedCategory.id ? updatedCategory : c))
    );
  const deleteCategory = (id: string) => {
    setCategories(categories.filter((c) => c.id !== id));
    setTasks(tasks.filter((t) => t.category !== id));
  };

  return {
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
  };
};
