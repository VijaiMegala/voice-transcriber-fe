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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Transcript</DialogTitle>
          <DialogDescription className="text-sm">
            Review your transcript below. You can save it or cancel.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 flex-1 overflow-hidden flex flex-col">
          <Textarea
            value={transcript}
            onChange={(e) => onTranscriptChange(e.target.value)}
            className="min-h-[200px] sm:min-h-[250px] max-h-[50vh] text-sm sm:text-base resize-none"
            placeholder="Your transcript will appear here..."
            disabled={isSaving}
          />
          {saveError && (
            <p className="text-xs sm:text-sm text-red-500 mt-2 break-words">{saveError}</p>
          )}
        </div>
        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onCancel} disabled={isSaving} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={onSave} disabled={isSaving || !transcript.trim()} className="w-full sm:w-auto">
            {isSaving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



