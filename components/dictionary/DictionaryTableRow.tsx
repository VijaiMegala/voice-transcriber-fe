"use client";

import { DictionaryItem } from "@/services/api.service";
import { Trash2 } from "lucide-react";
import { EditableCell } from "./EditableCell";

interface DictionaryTableRowProps {
  entry: DictionaryItem;
  editingEntry: { wordId: number; field: "currentWord" | "replacementWord"; value: string } | null;
  onStartEdit: (entry: DictionaryItem, field: "currentWord" | "replacementWord") => void;
  onSaveEdit: (wordId: number, field: "currentWord" | "replacementWord", newValue: string) => void;
  onCancelEdit: () => void;
  onDelete: (entry: DictionaryItem) => void;
}

export function DictionaryTableRow({
  entry,
  editingEntry,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: DictionaryTableRowProps) {
  const isEditingCurrent = editingEntry?.wordId === entry.wordId && editingEntry.field === "currentWord";
  const isEditingReplacement = editingEntry?.wordId === entry.wordId && editingEntry.field === "replacementWord";

  return (
    <div className="grid grid-cols-[1fr_1fr_auto] gap-2 sm:gap-4 border-b border-gray-200 px-2 sm:px-4 py-2 hover:bg-gray-50 transition-colors group">
      <EditableCell
        value={entry.currentWord}
        isEditing={isEditingCurrent}
        onStartEdit={() => onStartEdit(entry, "currentWord")}
        onSave={(newValue) => onSaveEdit(entry.wordId, "currentWord", newValue)}
        onCancel={onCancelEdit}
      />
      <EditableCell
        value={entry.replacementWord}
        isEditing={isEditingReplacement}
        onStartEdit={() => onStartEdit(entry, "replacementWord")}
        onSave={(newValue) => onSaveEdit(entry.wordId, "replacementWord", newValue)}
        onCancel={onCancelEdit}
      />
      <div className="flex items-center justify-end">
        <button
          className="p-1.5 hover:bg-red-50 active:bg-red-100 rounded transition-colors text-red-600 cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            onDelete(entry);
          }}
          aria-label="Delete entry"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

