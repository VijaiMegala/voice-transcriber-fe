"use client";

import { DictionaryItem } from "@/services/api.service";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical, Trash2 } from "lucide-react";
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
    <div className="grid grid-cols-[1fr_1fr_auto] gap-4 border-b border-gray-200 px-4 py-2 hover:bg-gray-50 transition-colors group">
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
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(entry);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

