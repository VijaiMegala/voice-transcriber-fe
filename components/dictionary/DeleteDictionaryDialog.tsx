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
          <DialogTitle className="text-lg sm:text-xl">Delete Dictionary Entry</DialogTitle>
          <DialogDescription className="text-sm break-words">
            Are you sure you want to delete "{entry?.currentWord}" → "{entry?.replacementWord}"? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

