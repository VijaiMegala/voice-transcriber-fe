"use client";

import { useState } from "react";
import { RecordingButton } from "@/components/RecordingButton";
import { TranscriptModal } from "@/components/TranscriptModal";
import { LiveTranscript } from "@/components/LiveTranscript";
import { PageLayout } from "@/components/PageLayout";
import { useRecording } from "@/hooks/useRecording";

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

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log("Saving transcript:", transcript);
    setIsModalOpen(false);
    setTranscript("");
  };

  const handleCancel = () => {
    setIsModalOpen(false);
    setTranscript("");
  };

  return (
    <PageLayout>
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
      />
    </PageLayout>
  );
}

