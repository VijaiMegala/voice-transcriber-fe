"use client";

import { useState, useEffect, useMemo } from "react";
import { PageLayout } from "@/components/PageLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiService, TranscriptItem } from "@/services/api.service";
import { MoreVertical, Edit2, Trash2, Pencil, Menu } from "lucide-react";
import Link from "next/link";

type TabType = "history" | "dictionary";

export default function HistoryPage() {
  const [activeTab, setActiveTab] = useState<TabType>("history");
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [selectedTranscript, setSelectedTranscript] = useState<TranscriptItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [transcriptToRename, setTranscriptToRename] = useState<TranscriptItem | null>(null);
  const [newName, setNewName] = useState("");
  const [isRenaming, setIsRenaming] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transcriptToDelete, setTranscriptToDelete] = useState<TranscriptItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    loadTranscripts();
  }, []);

  useEffect(() => {
    if (selectedTranscript) {
      setEditedContent(selectedTranscript.transcript);
    }
  }, [selectedTranscript]);

  const loadTranscripts = async () => {
    try {
      setIsLoading(true);
      const response = await apiService.getAllTranscripts({ limit: 100 });
      setTranscripts(response.transcripts);
      if (response.transcripts.length > 0 && !selectedTranscript) {
        setSelectedTranscript(response.transcripts[0]);
      }
    } catch (error) {
      console.error("Error loading transcripts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTranscripts = useMemo(() => {
    if (!searchQuery.trim()) {
      return transcripts;
    }
    const query = searchQuery.toLowerCase();
    return transcripts.filter(
      (t) =>
        t.transcriptName.toLowerCase().includes(query) ||
        t.transcript.toLowerCase().includes(query)
    );
  }, [transcripts, searchQuery]);

  const groupedTranscripts = useMemo(() => {
    const groups: { [key: string]: TranscriptItem[] } = {};
    filteredTranscripts.forEach((transcript) => {
      const date = new Date(transcript.createdAt);
      const dateKey = date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(transcript);
    });
    return groups;
  }, [filteredTranscripts]);

  const handleSaveEdit = async () => {
    if (!selectedTranscript) return;

    setIsSaving(true);
    try {
      const updated = await apiService.updateTranscript(selectedTranscript.transcriptId, {
        transcript: editedContent,
      });
      setSelectedTranscript(updated);
      setTranscripts((prev) =>
        prev.map((t) => (t.transcriptId === updated.transcriptId ? updated : t))
      );
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving transcript:", error);
      alert("Failed to save transcript");
    } finally {
      setIsSaving(false);
    }
  };

  const handleRename = (transcript: TranscriptItem) => {
    setTranscriptToRename(transcript);
    setNewName(transcript.transcriptName);
    setRenameDialogOpen(true);
  };

  const handleRenameConfirm = async () => {
    if (!transcriptToRename || !newName.trim()) return;

    setIsRenaming(true);
    try {
      const updated = await apiService.renameTranscript(transcriptToRename.transcriptId, {
        transcriptName: newName.trim(),
      });
      setTranscripts((prev) =>
        prev.map((t) => (t.transcriptId === updated.transcriptId ? updated : t))
      );
      if (selectedTranscript?.transcriptId === updated.transcriptId) {
        setSelectedTranscript(updated);
      }
      setRenameDialogOpen(false);
      setTranscriptToRename(null);
      setNewName("");
    } catch (error) {
      console.error("Error renaming transcript:", error);
      alert("Failed to rename transcript");
    } finally {
      setIsRenaming(false);
    }
  };

  const handleDelete = (transcript: TranscriptItem) => {
    setTranscriptToDelete(transcript);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!transcriptToDelete) return;

    setIsDeleting(true);
    try {
      await apiService.deleteTranscript(transcriptToDelete.transcriptId);
      setTranscripts((prev) =>
        prev.filter((t) => t.transcriptId !== transcriptToDelete.transcriptId)
      );
      if (selectedTranscript?.transcriptId === transcriptToDelete.transcriptId) {
        const remaining = transcripts.filter((t) => t.transcriptId !== transcriptToDelete.transcriptId);
        setSelectedTranscript(remaining.length > 0 ? remaining[0] : null);
      }
      setDeleteDialogOpen(false);
      setTranscriptToDelete(null);
    } catch (error) {
      console.error("Error deleting transcript:", error);
      alert("Failed to delete transcript");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <PageLayout>
      <div className="w-full max-w-7xl h-[calc(100vh-120px)] sm:h-[calc(100vh-160px)] md:h-[calc(100vh-200px)] flex flex-col bg-white rounded-lg shadow-lg overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 sm:px-6 pt-3 sm:pt-4">
          <div className="flex items-center gap-2">
            {/* Mobile Sidebar Toggle Button */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="md:hidden p-2 hover:bg-gray-100 rounded transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="h-5 w-5 text-gray-700" />
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors ${
                activeTab === "history"
                  ? "text-black border-b-2 border-black"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              History
            </button>
            <Link
              href="/dictionary"
              className={`px-3 sm:px-4 py-2 text-sm sm:text-base font-medium transition-colors ${
                activeTab === "dictionary"
                  ? "text-black border-b-2 border-black"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Dictionary
            </Link>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden relative">
          {/* Mobile Sidebar Backdrop */}
          {isSidebarOpen && (
            <div
              className="md:hidden fixed inset-0 bg-black/50 z-[5]"
              onClick={() => setIsSidebarOpen(false)}
            />
          )}

          {/* Left Sidebar */}
          <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 absolute md:relative z-10 w-full md:w-80 border-r border-gray-200 flex flex-col bg-gray-50 transition-transform duration-300 ease-in-out h-full`}>
            {/* Search Bar */}
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <Input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full"
              />
            </div>

            {/* Transcript List */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
              {isLoading ? (
                <div className="text-center text-gray-500 py-8">Loading...</div>
              ) : Object.keys(groupedTranscripts).length === 0 ? (
                <div className="text-center text-gray-500 py-8">No transcripts found</div>
              ) : (
                Object.entries(groupedTranscripts)
                  .sort((a, b) => {
                    // Sort by the first transcript's date in each group
                    const dateA = new Date(a[1][0].createdAt).getTime();
                    const dateB = new Date(b[1][0].createdAt).getTime();
                    return dateB - dateA;
                  })
                  .map(([date, dateTranscripts]) => (
                    <div key={date} className="space-y-2">
                      <div className="px-3 py-2 bg-white rounded-lg text-xs sm:text-sm font-medium text-gray-700">
                        {date}
                      </div>
                      <div className="space-y-1">
                        {dateTranscripts.map((transcript) => (
                          <div
                            key={transcript.transcriptId}
                            className={`group flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                              selectedTranscript?.transcriptId === transcript.transcriptId
                                ? "bg-pink-100 text-pink-900"
                                : "hover:bg-gray-100 text-gray-700"
                            }`}
                            onClick={() => {
                              setSelectedTranscript(transcript);
                              setIsSidebarOpen(false);
                            }}
                          >
                            <span className="flex-1 truncate text-xs sm:text-sm">
                              {transcript.transcriptName}
                            </span>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                asChild
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button
                                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleRename(transcript);
                                  }}
                                >
                                  <Pencil className="mr-2 h-4 w-4" />
                                  Rename
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  variant="destructive"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDelete(transcript);
                                  }}
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Right Main Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedTranscript ? (
              <>
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 gap-2">
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 truncate flex-1">
                    {selectedTranscript.transcriptName}
                  </h2>
                  {!isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditing(true)}
                      className="flex-shrink-0"
                    >
                      <Edit2 className="h-4 w-4" />
                      <span className="hidden sm:inline">Edit</span>
                    </Button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6">
                  {isEditing ? (
                    <div className="space-y-4">
                      <Textarea
                        value={editedContent}
                        onChange={(e) => setEditedContent(e.target.value)}
                        className="min-h-[300px] sm:min-h-[400px] w-full text-sm sm:text-base"
                      />
                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          onClick={handleSaveEdit}
                          disabled={isSaving}
                          className="w-full sm:w-auto"
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditing(false);
                            setEditedContent(selectedTranscript.transcript);
                          }}
                          disabled={isSaving}
                          className="w-full sm:w-auto"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-4 sm:p-6 min-h-[300px] sm:min-h-[400px]">
                      <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {selectedTranscript.transcript || "Transcript 1 is the best ....."}
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500 p-4 text-center">
                <p className="text-sm sm:text-base">Select a transcript to view</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Rename Transcript</DialogTitle>
            <DialogDescription className="text-sm">
              Enter a new name for this transcript.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Transcript name"
            className="text-sm sm:text-base"
            onKeyDown={(e) => {
              if (e.key === "Enter" && newName.trim()) {
                handleRenameConfirm();
              }
            }}
          />
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
              disabled={isRenaming}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenameConfirm}
              disabled={isRenaming || !newName.trim()}
              className="w-full sm:w-auto"
            >
              {isRenaming ? "Renaming..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">Delete Transcript</DialogTitle>
            <DialogDescription className="text-sm break-words">
              Are you sure you want to delete "{transcriptToDelete?.transcriptName}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="w-full sm:w-auto"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageLayout>
  );
}

