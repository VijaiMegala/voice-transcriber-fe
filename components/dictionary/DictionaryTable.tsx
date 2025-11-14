"use client";

import { DictionaryItem } from "@/services/api.service";
import { DictionaryTableRow } from "./DictionaryTableRow";

interface DictionaryTableProps {
  entries: DictionaryItem[];
  isLoading: boolean;
  searchQuery: string;
  editingEntry: { wordId: number; field: "currentWord" | "replacementWord"; value: string } | null;
  onStartEdit: (entry: DictionaryItem, field: "currentWord" | "replacementWord") => void;
  onSaveEdit: (wordId: number, field: "currentWord" | "replacementWord", newValue: string) => void;
  onCancelEdit: () => void;
  onDelete: (entry: DictionaryItem) => void;
}

export function DictionaryTable({
  entries,
  isLoading,
  searchQuery,
  editingEntry,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}: DictionaryTableProps) {
  return (
    <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg">
      <div className="min-w-full">
        <div className="grid grid-cols-[1fr_1fr_auto] gap-2 sm:gap-4 bg-gray-50 border-b border-gray-200 px-2 sm:px-4 py-2 sticky top-0 z-10">
          <div className="font-semibold text-xs sm:text-sm text-gray-700">Current Word</div>
          <div className="font-semibold text-xs sm:text-sm text-gray-700">Replacement Word</div>
          <div className="w-8 sm:w-10"></div>
        </div>

        {isLoading ? (
          <div className="text-center text-gray-500 py-8 text-sm sm:text-base">Loading...</div>
        ) : entries.length === 0 ? (
          <div className="text-center text-gray-500 py-8 px-4 text-sm sm:text-base">
            {searchQuery ? "No entries found" : "No dictionary entries yet. Click Add to create one."}
          </div>
        ) : (
          entries.map((entry) => (
            <DictionaryTableRow
              key={entry.wordId}
              entry={entry}
              editingEntry={editingEntry}
              onStartEdit={onStartEdit}
              onSaveEdit={onSaveEdit}
              onCancelEdit={onCancelEdit}
              onDelete={onDelete}
            />
          ))
        )}
      </div>
    </div>
  );
}

