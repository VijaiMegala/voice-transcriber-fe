/**
 * Client-side speech recognition service using Web Speech API
 * This is a fallback when LiveKit transcription is not available
 */

export interface SpeechRecognitionResult {
  transcript: string;
  isFinal: boolean;
}

export type SpeechRecognitionCallback = (result: SpeechRecognitionResult) => void;

class SpeechRecognitionService {
  private recognition: any = null;
  private callback: SpeechRecognitionCallback | null = null;
  private isListening: boolean = false;

  constructor() {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          this.recognition = new SpeechRecognition();
          this.setupRecognition();
        } catch (error) {
          console.warn("Failed to initialize SpeechRecognition:", error);
          this.recognition = null;
        }
      } else {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        if (isIOS) {
          console.warn(
            "Web Speech API is not supported on iOS Safari. LiveKit transcription service is required."
          );
        } else {
          console.warn(
            "Web Speech API is not supported in this browser. LiveKit transcription service is required."
          );
        }
      }
    }
  }

  private setupRecognition(): void {
    if (!this.recognition) return;

    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = "en-US";

    this.recognition.onresult = (event: any) => {
      let interimTranscript = "";
      let finalTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + " ";
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript.trim()) {
        console.log("Speech recognition final result:", finalTranscript);
        this.callback?.({
          transcript: finalTranscript.trim(),
          isFinal: true,
        });
      } else if (interimTranscript.trim()) {
        this.callback?.({
          transcript: interimTranscript.trim(),
          isFinal: false,
        });
      }
    };

    this.recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "no-speech") {
        return;
      }
      if (this.isListening) {
        try {
          this.recognition.stop();
          setTimeout(() => {
            if (this.isListening) {
              this.recognition.start();
            }
          }, 100);
        } catch (error) {
          console.error("Error restarting recognition:", error);
        }
      }
    };

    this.recognition.onend = () => {
      if (this.isListening) {
        try {
          this.recognition.start();
        } catch (error) {
          console.error("Error restarting recognition after end:", error);
        }
      }
    };
  }

  start(callback: SpeechRecognitionCallback): void {
    if (!this.recognition) {
      console.warn("Speech recognition not available");
      return;
    }

    this.callback = callback;
    this.isListening = true;

    try {
      this.recognition.start();
      console.log("Speech recognition started");
    } catch (error: any) {
      if (error.message?.includes("already started")) {
        return;
      }
      console.error("Error starting speech recognition:", error);
    }
  }

  stop(): void {
    if (!this.recognition) return;

    this.isListening = false;
    this.callback = null;

    try {
      this.recognition.stop();
      console.log("Speech recognition stopped");
    } catch (error) {
      console.error("Error stopping speech recognition:", error);
    }
  }

  isAvailable(): boolean {
    return this.recognition !== null;
  }
}

export const speechRecognitionService = new SpeechRecognitionService();



