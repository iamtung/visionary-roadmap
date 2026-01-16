import React from "react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Task, Category } from "../../types";
import { Trash2 } from "lucide-react";

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  isEditing: boolean;
  editingTaskId?: string;
  formData: Omit<Task, "id">;
  setFormData: React.Dispatch<React.SetStateAction<Omit<Task, "id">>>;
  categories: Category[];
  onSave: (e: React.FormEvent) => void;
  onDelete?: (id: string) => void;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  isEditing,
  editingTaskId,
  formData,
  setFormData,
  categories,
  onSave,
  onDelete,
}) => {
  const inputClass =
    "w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all duration-200 placeholder:text-slate-400 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 dark:focus:bg-slate-700 dark:placeholder:text-slate-500";
  const labelClass =
    "block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5";

  const handleDelete = () => {
    if (editingTaskId && onDelete) {
      if (window.confirm("Are you sure you want to delete this task?")) {
        onDelete(editingTaskId);
        onClose();
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Task" : "Create New Task"}
    >
      <form onSubmit={onSave} className="space-y-5">
        <div>
          <label className={labelClass}>Task Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={inputClass}
            placeholder="e.g., User Authentication"
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Area</label>
            <div className="relative">
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    category: e.target.value,
                  })
                }
                className={`${inputClass} appearance-none cursor-pointer`}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </div>
            </div>
          </div>
          <div>
            <label className={labelClass}>Duration (Weeks)</label>
            <input
              type="number"
              min="2"
              max="52"
              required
              value={formData.durationWeeks}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  durationWeeks: parseInt(e.target.value) || 0,
                })
              }
              onBlur={(e) => {
                const value = parseInt(e.target.value) || 2;
                setFormData({
                  ...formData,
                  durationWeeks: Math.max(2, Math.min(52, value)),
                });
              }}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>Start Week (1-52)</label>
          <input
            type="number"
            min="1"
            max="52"
            required
            value={formData.startWeek}
            onChange={(e) =>
              setFormData({
                ...formData,
                startWeek: parseInt(e.target.value),
              })
            }
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Description</label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) =>
              setFormData({
                ...formData,
                description: e.target.value,
              })
            }
            className={`${inputClass} resize-none`}
            placeholder="Brief description of the task..."
          />
        </div>

        <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-700 mt-6">
          {/* Delete button - only show when editing */}
          <div>
            {isEditing && onDelete && (
              <Button
                type="button"
                variant="ghost"
                onClick={handleDelete}
                className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950 dark:text-red-400"
              >
                <Trash2 size={16} className="mr-1.5" />
                Delete
              </Button>
            )}
          </div>

          {/* Save/Cancel buttons */}
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              {isEditing ? "Save Changes" : "Create Task"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
