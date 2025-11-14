import { useState, useCallback, useRef, useEffect } from "react";
import { liveKitService } from "@/services/livekit.service";
import { apiService } from "@/services/api.service";
import { ensureMicrophoneAccess } from "@/lib/utils";
import { ConnectionState } from "livekit-client";
import { speechRecognitionService } from "@/services/speech-recognition.service";

interface UseRecordingReturn {
  isMicOn: boolean;
  isConnecting: boolean;
  isTranscribing: boolean;
  transcript: string;
  connectionState: ConnectionState | null;
  audioLevel: number;
  error: string | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  setTranscript: (text: string) => void;
}

export function useRecording(): UseRecordingReturn {
  const [isMicOn, setIsMicOn] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [connectionState, setConnectionState] = useState<ConnectionState | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const roomNameRef = useRef<string | null>(null);
  const liveKitTranscriptReceivedRef = useRef<boolean>(false);
  const speechRecognitionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processedTranscriptsRef = useRef<Set<string>>(new Set());
  const isRecordingRef = useRef<boolean>(false);
  const baseTranscriptRef = useRef<string>(""); // Track final results only
  const interimTranscriptRef = useRef<string>(""); // Track current interim result

  const startRecording = useCallback(async () => {
    // Prevent multiple simultaneous starts
    if (isRecordingRef.current) {
      console.warn("Recording already in progress");
      return;
    }

    try {
      setError(null);
      setIsConnecting(true);
      setIsTranscribing(false); // Reset transcription state
      setTranscript(""); // Clear previous transcript
      processedTranscriptsRef.current.clear(); // Clear processed transcripts set
      baseTranscriptRef.current = ""; // Clear base transcript
      interimTranscriptRef.current = ""; // Clear interim transcript
      isRecordingRef.current = true;

      // Check and request microphone permission before requesting token
      await ensureMicrophoneAccess();

      // Get token from backend
      const roomName = `room-${Date.now()}`;
      const { token } = await apiService.getLiveKitToken({
        roomName,
        participantName: "user",
      });

      const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_WEB_SOCKET_URL || "";
      if (!wsUrl) {
        throw new Error("LiveKit WebSocket URL is not configured. Please set NEXT_PUBLIC_LIVEKIT_WEB_SOCKET_URL in your .env.local file.");
      }

      // Set up connection state callback
      // Use a ref to track if we should handle disconnects (avoid stale closure)
      const shouldHandleDisconnectRef = { current: true };
      
      liveKitService.setConnectionStateCallback((state: ConnectionState) => {
        setConnectionState(state);
        if (state === ConnectionState.Disconnected && shouldHandleDisconnectRef.current) {
          setIsMicOn(false);
          setIsTranscribing(false);
          isRecordingRef.current = false;
        }
      });

      // Set up audio level callback
      liveKitService.setAudioLevelCallback((level: number) => {
        setAudioLevel(level);
      });

      // Reset LiveKit transcript flag
      liveKitTranscriptReceivedRef.current = false;

      // Set up transcript callback from LiveKit
      liveKitService.setTranscriptCallback(async (text: string) => {
        if (!text || !text.trim()) return; // Ignore empty transcripts
        
        // Only process if we're still recording
        if (!isRecordingRef.current) {
          console.log("Ignoring LiveKit transcript - recording stopped");
          return;
        }
        
        // Create a normalized key for deduplication (lowercase, trimmed)
        const normalizedKey = text.trim().toLowerCase();
        
        // Skip if we've already processed this exact transcript
        if (processedTranscriptsRef.current.has(normalizedKey)) {
          console.log("Skipping duplicate LiveKit transcript:", text);
          return;
        }
        
        console.log("LiveKit transcript received:", text);
        liveKitTranscriptReceivedRef.current = true;
        processedTranscriptsRef.current.add(normalizedKey);
        
        // Mark transcription as active when we receive the first transcript
        setIsTranscribing(true);
        
        // If LiveKit is sending transcripts, stop Web Speech API to avoid duplicates
        // Only stop if it's actually running
        if (speechRecognitionService.isAvailable() && isRecordingRef.current) {
          // Clear the timeout so it doesn't start
          if (speechRecognitionTimeoutRef.current) {
            clearTimeout(speechRecognitionTimeoutRef.current);
            speechRecognitionTimeoutRef.current = null;
          }
          speechRecognitionService.stop();
          console.log("Stopped Web Speech API - LiveKit transcription is active");
        }
        
        // Update base transcript (LiveKit sends final results)
        baseTranscriptRef.current = baseTranscriptRef.current 
          ? baseTranscriptRef.current + " " + text 
          : text;
        interimTranscriptRef.current = ""; // Clear any interim results
        
        // Update displayed transcript
        setTranscript(baseTranscriptRef.current);
        
        // Send transcript chunk to backend
        const currentRoomName = liveKitService.getRoomName();
        if (currentRoomName) {
          apiService
            .sendTranscriptChunk({
              roomName: currentRoomName,
              transcript: text,
            })
            .catch(console.error);
        }
      });

      // Set up fallback client-side speech recognition if available
      // Only start if LiveKit doesn't send transcripts within 3 seconds
      if (speechRecognitionService.isAvailable()) {
        // Wait 3 seconds to see if LiveKit sends transcripts
        speechRecognitionTimeoutRef.current = setTimeout(() => {
          // If LiveKit hasn't sent any transcripts, start Web Speech API
          if (!liveKitTranscriptReceivedRef.current && isRecordingRef.current) {
            console.log("Starting fallback speech recognition (LiveKit transcription not detected)...");
            setIsTranscribing(true); // Mark transcription as active when Web Speech API starts
            speechRecognitionService.start((result) => {
              if (!isRecordingRef.current) return; // Don't process if recording stopped
              
              if (result.isFinal) {
                if (!result.transcript || !result.transcript.trim()) return; // Ignore empty transcripts
                
                // Create a normalized key for deduplication
                const normalizedKey = result.transcript.trim().toLowerCase();
                
                // Skip if we've already processed this exact transcript
                if (processedTranscriptsRef.current.has(normalizedKey)) {
                  console.log("Skipping duplicate Web Speech API transcript:", result.transcript);
                  return;
                }
                
                console.log("Client-side transcript:", result.transcript);
                processedTranscriptsRef.current.add(normalizedKey);
                
                // Add final result to base transcript and clear interim
                const finalText = result.transcript.trim();
                baseTranscriptRef.current = baseTranscriptRef.current 
                  ? baseTranscriptRef.current + " " + finalText 
                  : finalText;
                interimTranscriptRef.current = ""; // Clear interim result
                
                // Update displayed transcript (base only, no interim)
                setTranscript(baseTranscriptRef.current);
                
                // Send transcript chunk to backend
                const currentRoomName = liveKitService.getRoomName();
                if (currentRoomName) {
                  apiService
                    .sendTranscriptChunk({
                      roomName: currentRoomName,
                      transcript: finalText,
                    })
                    .catch(console.error);
                }
              } else {
                // Show interim results - update interim ref and display base + interim
                interimTranscriptRef.current = result.transcript.trim();
                const displayText = baseTranscriptRef.current 
                  ? baseTranscriptRef.current + " " + interimTranscriptRef.current
                  : interimTranscriptRef.current;
                setTranscript(displayText);
              }
            });
          } else {
            console.log("Skipping Web Speech API - LiveKit transcription is active");
          }
        }, 3000);
      } else {
        console.warn("Web Speech API not available. Please configure a transcription service on your LiveKit server.");
      }

      // Connect to LiveKit
      try {
        await liveKitService.connect({ wsUrl, token });
        roomNameRef.current = liveKitService.getRoomName();
        const currentState = liveKitService.getConnectionState();
        setConnectionState(currentState);
        
        // Check if connection was successful
        if (currentState !== ConnectionState.Connected) {
          console.warn("Connection state after connect is not Connected:", currentState);
          // Wait a bit and check again
          await new Promise(resolve => setTimeout(resolve, 1000));
          const newState = liveKitService.getConnectionState();
          if (newState !== ConnectionState.Connected) {
            throw new Error(`Failed to establish connection. State: ${newState}`);
          }
        }

        setIsMicOn(true);
        setIsConnecting(false);
      } catch (connectError: any) {
        console.error("Error during LiveKit connection:", connectError);
        shouldHandleDisconnectRef.current = false; // Don't trigger disconnect handler
        throw connectError; // Re-throw to be caught by outer catch
      }
    } catch (error: any) {
      console.error("Error starting recording:", error);
      const errorMessage = error?.message || "Failed to start recording. Please check your microphone permissions and LiveKit configuration.";
      setError(errorMessage);
      setIsConnecting(false);
      setIsMicOn(false);
      setIsTranscribing(false);
      isRecordingRef.current = false;
      // Don't throw - let the UI handle the error state
    }
  }, [isMicOn]);

  const stopRecording = useCallback(async () => {
    if (!isRecordingRef.current) {
      console.warn("Recording not in progress");
      return;
    }

    try {
      setError(null);
      const roomName = roomNameRef.current;
      isRecordingRef.current = false;

      // Clear timeout if it exists
      if (speechRecognitionTimeoutRef.current) {
        clearTimeout(speechRecognitionTimeoutRef.current);
        speechRecognitionTimeoutRef.current = null;
      }

      // Stop speech recognition
      speechRecognitionService.stop();

      // Clear transcript callback to prevent any late-arriving transcripts
      liveKitService.setTranscriptCallback(null);

      // Mark transcription as inactive
      setIsTranscribing(false);

      // Disconnect from LiveKit
      await liveKitService.disconnect();
      setConnectionState(null);
      setAudioLevel(0);

      // Get final transcript from backend, but only use it if it's different/better than what we have
      // This prevents overwriting with duplicates
      if (roomName) {
        try {
          const { transcript: finalTranscript } =
            await apiService.getFinalTranscript({ roomName });
          if (finalTranscript && finalTranscript.trim() && !finalTranscript.includes("There is no transcript")) {
            // Only update if the backend transcript is significantly different or if we don't have a client transcript
            const currentTranscript = transcript.trim();
            const backendTranscript = finalTranscript.trim();
            
            // Normalize both for comparison
            const currentNormalized = currentTranscript.toLowerCase();
            const backendNormalized = backendTranscript.toLowerCase();
            
            // If backend transcript is substantially different (not just a duplicate), use it
            // Otherwise, keep the client-side transcript to avoid duplicates
            if (!currentTranscript || 
                (!backendNormalized.includes(currentNormalized) && !currentNormalized.includes(backendNormalized))) {
              setTranscript(backendTranscript);
            } else {
              // Backend transcript is similar to what we have, keep client version to avoid duplicates
              console.log("Keeping client-side transcript to avoid duplicates");
            }
          } else if (transcript.trim()) {
            // Use the transcript we already have if backend doesn't have it
            console.log("Using client-side transcript");
          }
        } catch (error) {
          console.error("Error getting final transcript:", error);
          // Use the transcript we already have
          if (transcript.trim()) {
            console.log("Using client-side transcript due to error");
          }
        }
      }

      setIsMicOn(false);
    } catch (error: any) {
      console.error("Error stopping recording:", error);
      setError(error?.message || "Failed to stop recording");
      setIsMicOn(false);
      setIsTranscribing(false);
      isRecordingRef.current = false;
    }
  }, [transcript]);

  // Cleanup on unmount only (not when isMicOn changes)
  useEffect(() => {
    return () => {
      // Only cleanup if we're actually recording (check ref, not state)
      if (isRecordingRef.current) {
        console.log("Component unmounting, cleaning up recording...");
        isRecordingRef.current = false;
        speechRecognitionService.stop();
        liveKitService.setTranscriptCallback(null);
        liveKitService.disconnect().catch(console.error);
      }
    };
    // Empty dependency array - only run cleanup on unmount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
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
  };
}

