"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

interface AddDictionaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (currentWord: string, replacementWord: string) => Promise<void>;
  isAdding?: boolean;
}

export function AddDictionaryDialog({
  open,
  onOpenChange,
  onAdd,
  isAdding = false,
}: AddDictionaryDialogProps) {
  const [currentWord, setCurrentWord] = useState("");
  const [replacementWord, setReplacementWord] = useState("");

  useEffect(() => {
    if (!open) {
      setCurrentWord("");
      setReplacementWord("");
    }
  }, [open]);

  const handleAdd = async () => {
    if (!currentWord.trim() || !replacementWord.trim()) {
      return;
    }
    await onAdd(currentWord.trim(), replacementWord.trim());
  };

  const handleCancel = () => {
    onOpenChange(false);
    setCurrentWord("");
    setReplacementWord("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Add Dictionary Entry</DialogTitle>
          <DialogDescription className="text-sm">
            Add a new word replacement pair to your dictionary.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Current Word
            </label>
            <Input
              value={currentWord}
              onChange={(e) => setCurrentWord(e.target.value)}
              placeholder="e.g., Hello"
              className="text-sm sm:text-base"
              onKeyDown={(e) => {
                if (e.key === "Enter" && currentWord.trim() && replacementWord.trim()) {
                  handleAdd();
                }
              }}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Replacement Word
            </label>
            <Input
              value={replacementWord}
              onChange={(e) => setReplacementWord(e.target.value)}
              placeholder="e.g., Hi"
              className="text-sm sm:text-base"
              onKeyDown={(e) => {
                if (e.key === "Enter" && currentWord.trim() && replacementWord.trim()) {
                  handleAdd();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={handleCancel} disabled={isAdding} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={isAdding || !currentWord.trim() || !replacementWord.trim()}
            className="w-full sm:w-auto"
          >
            {isAdding ? "Adding..." : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

