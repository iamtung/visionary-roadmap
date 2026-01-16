import React, { useState } from "react";
import { GripVertical, Trash2, Plus } from "lucide-react";
import { Modal } from "../common/Modal";
import { Button } from "../common/Button";
import { Category } from "../../types";

interface ManageAreasModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: () => void;
  onUpdateCategoryName: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  onReorderCategories?: (categories: Category[]) => void;
}

export const ManageAreasModal: React.FC<ManageAreasModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onUpdateCategoryName,
  onDeleteCategory,
  onReorderCategories,
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index.toString());
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    const newCategories = [...categories];
    const [draggedItem] = newCategories.splice(draggedIndex, 1);
    newCategories.splice(dropIndex, 0, draggedItem);

    if (onReorderCategories) {
      onReorderCategories(newCategories);
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Manage Areas">
      <div className="space-y-4">
        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2 -mr-2">
          {categories.length === 0 && (
            <div className="text-center py-6 text-slate-500 dark:text-slate-400 text-sm italic">
              No areas defined. Add one below.
            </div>
          )}
          {categories.map((category, index) => (
            <div
              key={category.id}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              className={`
                flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 
                group transition-all duration-150
                ${draggedIndex === index ? "opacity-50 scale-95" : ""}
                ${
                  dragOverIndex === index
                    ? "border-indigo-400 bg-indigo-50 dark:bg-indigo-950"
                    : "hover:border-indigo-200 hover:bg-white dark:hover:bg-slate-700"
                }
              `}
            >
              {/* Drag Handle */}
              <div
                className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-indigo-600 dark:text-slate-500 dark:hover:text-indigo-400 transition-colors"
                title="Drag to reorder"
              >
                <GripVertical size={18} />
              </div>

              {/* Name Input */}
              <div className="flex-grow">
                <input
                  type="text"
                  value={category.name}
                  onChange={(e) =>
                    onUpdateCategoryName(category.id, e.target.value)
                  }
                  className="w-full px-2 py-1 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-600 focus:border-indigo-500 focus:outline-none text-slate-800 dark:text-slate-200 text-sm font-medium transition-all"
                  placeholder="Area Name"
                  onMouseDown={(e) => e.stopPropagation()}
                />
              </div>

              {/* Actions */}
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setTimeout(() => {
                    onDeleteCategory(category.id);
                  }, 0);
                }}
                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-md transition-colors"
                title="Delete Area"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
          <Button
            type="button"
            variant="secondary"
            onClick={onAddCategory}
            className="w-full border-dashed border-2 hover:border-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950 hover:text-indigo-700 dark:hover:text-indigo-400"
            icon={<Plus size={16} />}
          >
            Add New Area
          </Button>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="primary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  );
};
