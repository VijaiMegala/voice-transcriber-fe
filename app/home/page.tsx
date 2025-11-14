"use client";

import { useState } from "react";
import { RecordingButton } from "@/components/RecordingButton";
import { TranscriptModal } from "@/components/TranscriptModal";
import { LiveTranscript } from "@/components/LiveTranscript";
import { PageLayout } from "@/components/PageLayout";
import { useRecording } from "@/hooks/useRecording";
import { apiService } from "@/services/api.service";
import { useToast } from "@/components/ui/toast";

export default function HomePage() {
  const {
    isMicOn,
    isConnecting,
    isTranscribing,
    transcript,
    connectionState,
    audioLevel,
    error,
    startRecording,
    stopRecording,
    setTranscript,
  } = useRecording();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { showToast, ToastProvider } = useToast();

  const handleToggle = async () => {
    if (isMicOn) {
      await stopRecording();
      // Open modal if there's a transcript
      if (transcript.trim()) {
        setIsModalOpen(true);
      }
    } else {
      await startRecording();
    }
  };

  const handleSave = async () => {
    if (!transcript.trim()) {
      return;
    }

    setIsSaving(true);
    setSaveError(null);

    try {
      await apiService.createTranscript({ transcript: transcript.trim() });
      setIsModalOpen(false);
      setTranscript("");
      showToast("Transcript saved successfully!", "success");
    } catch (error: any) {
      console.error("Error saving transcript:", error);
      const errorMessage = error.message || "Failed to save transcript";
      setSaveError(errorMessage);
      showToast(errorMessage, "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setTranscript("");
    setSaveError(null);
  };

  return (
    <PageLayout>
      <ToastProvider />
      <RecordingButton
        isMicOn={isMicOn}
        isConnecting={isConnecting}
        connectionState={connectionState}
        audioLevel={audioLevel}
        error={error}
        onToggle={handleToggle}
      />

      {isTranscribing && <LiveTranscript transcript={transcript} />}

      <TranscriptModal
        open={isModalOpen}
        transcript={transcript}
        onOpenChange={setIsModalOpen}
        onSave={handleSave}
        onCancel={handleCancel}
        onTranscriptChange={setTranscript}
        isSaving={isSaving}
        saveError={saveError}
      />
    </PageLayout>
  );
}
