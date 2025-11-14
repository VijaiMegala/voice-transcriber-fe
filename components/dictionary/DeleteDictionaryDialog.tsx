"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DictionaryItem } from "@/services/api.service";

interface DeleteDictionaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry: DictionaryItem | null;
  onConfirm: () => Promise<void>;
  isDeleting?: boolean;
}

export function DeleteDictionaryDialog({
  open,
  onOpenChange,
  entry,
  onConfirm,
  isDeleting = false,
}: DeleteDictionaryDialogProps) {
  const handleConfirm = async () => {
    await onConfirm();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Dictionary Entry</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{entry?.currentWord}" → "{entry?.replacementWord}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

