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
}

export function TranscriptModal({
  open,
  transcript,
  onOpenChange,
  onSave,
  onCancel,
  onTranscriptChange,
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
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



