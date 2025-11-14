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
          <DialogTitle>Add Dictionary Entry</DialogTitle>
          <DialogDescription>
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && currentWord.trim() && replacementWord.trim()) {
                  handleAdd();
                }
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isAdding}>
            Cancel
          </Button>
          <Button
            onClick={handleAdd}
            disabled={isAdding || !currentWord.trim() || !replacementWord.trim()}
          >
            {isAdding ? "Adding..." : "Add"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

