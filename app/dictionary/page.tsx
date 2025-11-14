"use client";

import { useState, useEffect, useMemo } from "react";
import { PageLayout } from "@/components/PageLayout";
import { apiService, DictionaryItem } from "@/services/api.service";
import { useToast } from "@/components/ui/toast";
import { DictionaryTabs } from "@/components/dictionary/DictionaryTabs";
import { DictionarySearchBar } from "@/components/dictionary/DictionarySearchBar";
import { DictionaryTable } from "@/components/dictionary/DictionaryTable";
import { AddDictionaryDialog } from "@/components/dictionary/AddDictionaryDialog";
import { DeleteDictionaryDialog } from "@/components/dictionary/DeleteDictionaryDialog";

export default function DictionaryPage() {
  const [dictionaryEntries, setDictionaryEntries] = useState<DictionaryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<{ wordId: number; field: "currentWord" | "replacementWord"; value: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [entryToDelete, setEntryToDelete] = useState<DictionaryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const { showToast, ToastProvider } = useToast();

  useEffect(() => {
    loadDictionaryEntries();
  }, []);

  const loadDictionaryEntries = async () => {
    try {
      setIsLoading(true);
      const entries = await apiService.getAllDictionaryEntries();
      setDictionaryEntries(entries);
    } catch (error: any) {
      console.error("Error loading dictionary entries:", error);
      showToast(error.message || "Failed to load dictionary entries", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) {
      return dictionaryEntries;
    }
    const query = searchQuery.toLowerCase();
    return dictionaryEntries.filter(
      (entry) =>
        entry.currentWord.toLowerCase().includes(query) ||
        entry.replacementWord.toLowerCase().includes(query)
    );
  }, [dictionaryEntries, searchQuery]);

  const handleAdd = async (currentWord: string, replacementWord: string) => {
    setIsAdding(true);
    try {
      const newEntry = await apiService.createDictionaryEntry({
        currentWord,
        replacementWord,
      });
      setDictionaryEntries((prev) => [newEntry, ...prev]);
      setAddDialogOpen(false);
      showToast("Dictionary entry added successfully!", "success");
    } catch (error: any) {
      console.error("Error adding dictionary entry:", error);
      showToast(error.message || "Failed to add dictionary entry", "error");
    } finally {
      setIsAdding(false);
    }
  };

  const handleDoubleClick = (entry: DictionaryItem, field: "currentWord" | "replacementWord") => {
    setEditingEntry({
      wordId: entry.wordId,
      field,
      value: entry[field],
    });
  };

  const handleEditSave = async (wordId: number, field: "currentWord" | "replacementWord", newValue: string) => {
    if (!newValue.trim()) {
      showToast("Word cannot be empty", "error");
      setEditingEntry(null);
      return;
    }

    try {
      const updateData: { currentWord?: string; replacementWord?: string } = {};
      updateData[field] = newValue.trim();

      const updated = await apiService.updateDictionaryEntry(wordId, updateData);
      setDictionaryEntries((prev) =>
        prev.map((entry) => (entry.wordId === wordId ? updated : entry))
      );
      setEditingEntry(null);
      showToast("Dictionary entry updated successfully!", "success");
    } catch (error: any) {
      console.error("Error updating dictionary entry:", error);
      showToast(error.message || "Failed to update dictionary entry", "error");
      setEditingEntry(null);
    }
  };

  const handleDelete = (entry: DictionaryItem) => {
    setEntryToDelete(entry);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!entryToDelete) return;

    setIsDeleting(true);
    try {
      await apiService.deleteDictionaryEntry(entryToDelete.wordId);
      setDictionaryEntries((prev) =>
        prev.filter((entry) => entry.wordId !== entryToDelete.wordId)
      );
      setDeleteDialogOpen(false);
      setEntryToDelete(null);
      showToast("Dictionary entry deleted successfully!", "success");
    } catch (error: any) {
      console.error("Error deleting dictionary entry:", error);
      showToast(error.message || "Failed to delete dictionary entry", "error");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageLayout>
      <ToastProvider />
      <div className="w-full max-w-7xl h-[calc(100vh-120px)] sm:h-[calc(100vh-160px)] md:h-[calc(100vh-200px)] flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
        <DictionaryTabs />

        <div className="flex-1 flex flex-col overflow-hidden p-3 sm:p-4 md:p-6">
          <DictionarySearchBar
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onAddClick={() => setAddDialogOpen(true)}
          />

          <DictionaryTable
            entries={filteredEntries}
            isLoading={isLoading}
            searchQuery={searchQuery}
            editingEntry={editingEntry}
            onStartEdit={handleDoubleClick}
            onSaveEdit={handleEditSave}
            onCancelEdit={() => setEditingEntry(null)}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <AddDictionaryDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onAdd={handleAdd}
        isAdding={isAdding}
      />

      <DeleteDictionaryDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        entry={entryToDelete}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </PageLayout>
  );
}
