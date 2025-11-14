import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface TranscriptModalProps {
  open: boolean;
  transcript: string;
  onOpenChange: (open: boolean) => void;
  onSave: () => void;
  onCancel: () => void;
  onTranscriptChange: (text: string) => void;
  isSaving?: boolean;
  saveError?: string | null;
}

export function TranscriptModal({
  open,
  transcript,
  onOpenChange,
  onSave,
  onCancel,
  onTranscriptChange,
  isSaving = false,
  saveError = null,
}: TranscriptModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Transcript</DialogTitle>
          <DialogDescription>
            Review your transcript below. You can save it or cancel.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Textarea
            value={transcript}
            onChange={(e) => onTranscriptChange(e.target.value)}
            className="min-h-[200px]"
            placeholder="Your transcript will appear here..."
            disabled={isSaving}
          />
          {saveError && (
            <p className="text-sm text-red-500 mt-2">{saveError}</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving || !transcript.trim()}>
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



