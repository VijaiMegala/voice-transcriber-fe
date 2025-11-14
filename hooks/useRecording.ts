import { useState, useCallback, useRef, useEffect } from "react";
import { liveKitService } from "@/services/livekit.service";
import { apiService, DictionaryItem } from "@/services/api.service";
import { ensureMicrophoneAccess, replaceWordsWithDictionary } from "@/lib/utils";
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
  const baseTranscriptRef = useRef<string>("");
  const interimTranscriptRef = useRef<string>("");
  const dictionaryEntriesRef = useRef<DictionaryItem[]>([]);
  const transcriptPollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPolledTranscriptRef = useRef<string>("");

  const startRecording = useCallback(async () => {
    if (isRecordingRef.current) {
      console.warn("Recording already in progress");
      return;
    }

    try {
      setError(null);
      setIsConnecting(true);
      setIsTranscribing(false);
      setTranscript("");
      processedTranscriptsRef.current.clear();
      baseTranscriptRef.current = "";
      interimTranscriptRef.current = "";
      lastPolledTranscriptRef.current = "";
      isRecordingRef.current = true;

      await ensureMicrophoneAccess();
      try {
        const entries = await apiService.getAllDictionaryEntries();
        dictionaryEntriesRef.current = entries;
        console.log("Loaded dictionary entries for real-time replacement:", entries.length);
      } catch (error) {
        console.warn("Failed to load dictionary entries, continuing without replacements:", error);
        dictionaryEntriesRef.current = [];
      }

      const roomName = `room-${Date.now()}`;
      const { token } = await apiService.getLiveKitToken({
        roomName,
        participantName: "user",
      });

      const wsUrl = process.env.NEXT_PUBLIC_LIVEKIT_WEB_SOCKET_URL || "";
      if (!wsUrl) {
        throw new Error("LiveKit WebSocket URL is not configured. Please set NEXT_PUBLIC_LIVEKIT_WEB_SOCKET_URL in your .env.local file.");
      }

      const shouldHandleDisconnectRef = { current: true };
      
      liveKitService.setConnectionStateCallback((state: ConnectionState) => {
        setConnectionState(state);
        if (state === ConnectionState.Disconnected && shouldHandleDisconnectRef.current) {
          setIsMicOn(false);
          setIsTranscribing(false);
          isRecordingRef.current = false;
        }
      });

      liveKitService.setAudioLevelCallback((level: number) => {
        setAudioLevel(level);
      });

      liveKitTranscriptReceivedRef.current = false;

      liveKitService.setTranscriptCallback(async (text: string) => {
        if (!text || !text.trim()) return;
        
        if (!isRecordingRef.current) {
          console.log("Ignoring LiveKit transcript - recording stopped");
          return;
        }
        
        const normalizedKey = text.trim().toLowerCase();
        
        if (processedTranscriptsRef.current.has(normalizedKey)) {
          console.log("Skipping duplicate LiveKit transcript:", text);
          return;
        }
        
        console.log("LiveKit transcript received:", text);
        liveKitTranscriptReceivedRef.current = true;
        processedTranscriptsRef.current.add(normalizedKey);
        
        setIsTranscribing(true);
        
        if (speechRecognitionService.isAvailable() && isRecordingRef.current) {
          if (speechRecognitionTimeoutRef.current) {
            clearTimeout(speechRecognitionTimeoutRef.current);
            speechRecognitionTimeoutRef.current = null;
          }
          speechRecognitionService.stop();
          console.log("Stopped Web Speech API - LiveKit transcription is active");
        }
        
        const newText = text.trim();
        baseTranscriptRef.current = baseTranscriptRef.current 
          ? baseTranscriptRef.current + " " + newText 
          : newText;
        interimTranscriptRef.current = "";
        
        const replacedText = replaceWordsWithDictionary(
          baseTranscriptRef.current,
          dictionaryEntriesRef.current
        );
        
        setTranscript(replacedText);
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

      if (speechRecognitionService.isAvailable()) {
        speechRecognitionTimeoutRef.current = setTimeout(() => {
          if (!liveKitTranscriptReceivedRef.current && isRecordingRef.current) {
            console.log("Starting fallback speech recognition (LiveKit transcription not detected)...");
            setIsTranscribing(true);
            speechRecognitionService.start((result) => {
              if (!isRecordingRef.current) return;
              
              if (result.isFinal) {
                if (!result.transcript || !result.transcript.trim()) return;
                
                const normalizedKey = result.transcript.trim().toLowerCase();
                
                if (processedTranscriptsRef.current.has(normalizedKey)) {
                  console.log("Skipping duplicate Web Speech API transcript:", result.transcript);
                  return;
                }
                
                console.log("Client-side transcript:", result.transcript);
                processedTranscriptsRef.current.add(normalizedKey);
                
                const finalText = result.transcript.trim();
                baseTranscriptRef.current = baseTranscriptRef.current 
                  ? baseTranscriptRef.current + " " + finalText 
                  : finalText;
                interimTranscriptRef.current = "";
                
                const replacedText = replaceWordsWithDictionary(
                  baseTranscriptRef.current,
                  dictionaryEntriesRef.current
                );
                
                setTranscript(replacedText);
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
                interimTranscriptRef.current = result.transcript.trim();
                const displayText = baseTranscriptRef.current 
                  ? baseTranscriptRef.current + " " + interimTranscriptRef.current
                  : interimTranscriptRef.current;
                
                const replacedText = replaceWordsWithDictionary(
                  displayText,
                  dictionaryEntriesRef.current
                );
                
                setTranscript(replacedText);
              }
            });
          } else {
            console.log("Skipping Web Speech API - LiveKit transcription is active");
          }
        }, 3000);
      } else {
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        if (isIOS) {
          console.warn("Web Speech API is not available on iOS. LiveKit transcription service is required for iOS devices.");
        } else {
          console.warn("Web Speech API not available. Please configure a transcription service on your LiveKit server.");
        }
      }

      transcriptPollingIntervalRef.current = setInterval(async () => {
        if (!isRecordingRef.current) return;
        
        const roomName = liveKitService.getRoomName();
        if (roomName && !liveKitTranscriptReceivedRef.current) {
          try {
            const { transcript: backendTranscript } = await apiService.getFinalTranscript({ roomName });
            if (backendTranscript && backendTranscript.trim() && 
                !backendTranscript.includes("There is no transcript") &&
                backendTranscript !== lastPolledTranscriptRef.current) {
              
              console.log("Received transcript from backend polling:", backendTranscript);
              lastPolledTranscriptRef.current = backendTranscript;
              
              liveKitTranscriptReceivedRef.current = true;
              setIsTranscribing(true);
              
              const replacedText = replaceWordsWithDictionary(
                backendTranscript.trim(),
                dictionaryEntriesRef.current
              );
              
              setTranscript(replacedText);
              baseTranscriptRef.current = backendTranscript.trim();
            }
          } catch (error) {
            console.debug("Polling for transcript (not available yet)");
          }
        }
      }, 2000);

      try {
        await liveKitService.connect({ wsUrl, token });
        roomNameRef.current = liveKitService.getRoomName();
        const currentState = liveKitService.getConnectionState();
        setConnectionState(currentState);
        
        if (currentState !== ConnectionState.Connected) {
          console.warn("Connection state after connect is not Connected:", currentState);
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
        shouldHandleDisconnectRef.current = false;
        throw connectError;
      }
    } catch (error: any) {
      console.error("Error starting recording:", error);
      const errorMessage = error?.message || "Failed to start recording. Please check your microphone permissions and LiveKit configuration.";
      setError(errorMessage);
      setIsConnecting(false);
      setIsMicOn(false);
      setIsTranscribing(false);
      isRecordingRef.current = false;
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

      if (speechRecognitionTimeoutRef.current) {
        clearTimeout(speechRecognitionTimeoutRef.current);
        speechRecognitionTimeoutRef.current = null;
      }

      if (transcriptPollingIntervalRef.current) {
        clearInterval(transcriptPollingIntervalRef.current);
        transcriptPollingIntervalRef.current = null;
      }

      speechRecognitionService.stop();

      liveKitService.setTranscriptCallback(null);

      setIsTranscribing(false);

      await liveKitService.disconnect();
      setConnectionState(null);
      setAudioLevel(0);

      if (roomName) {
        try {
          const { transcript: finalTranscript } =
            await apiService.getFinalTranscript({ roomName });
          if (finalTranscript && finalTranscript.trim() && !finalTranscript.includes("There is no transcript")) {
            const currentTranscript = transcript.trim();
            const backendTranscript = finalTranscript.trim();
            
            const currentNormalized = currentTranscript.toLowerCase();
            const backendNormalized = backendTranscript.toLowerCase();
            
            if (!currentTranscript || 
                (!backendNormalized.includes(currentNormalized) && !currentNormalized.includes(backendNormalized))) {
              const replacedBackendTranscript = replaceWordsWithDictionary(
                backendTranscript,
                dictionaryEntriesRef.current
              );
              setTranscript(replacedBackendTranscript);
            } else {
              console.log("Keeping client-side transcript to avoid duplicates");
            }
          } else if (transcript.trim()) {
            console.log("Using client-side transcript");
          }
        } catch (error) {
          console.error("Error getting final transcript:", error);
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

  useEffect(() => {
    return () => {
      if (isRecordingRef.current) {
        console.log("Component unmounting, cleaning up recording...");
        isRecordingRef.current = false;
        speechRecognitionService.stop();
        liveKitService.setTranscriptCallback(null);
        liveKitService.disconnect().catch(console.error);
      }
    };
    
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

