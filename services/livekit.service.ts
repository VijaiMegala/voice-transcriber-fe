import {
  Room,
  RoomEvent,
  LocalAudioTrack,
  RemoteParticipant,
  LocalTrackPublication,
  createLocalAudioTrack,
  ConnectionState,
  Track,
  DisconnectReason,
} from "livekit-client";

export interface LiveKitConfig {
  wsUrl: string;
  token: string;
}

export interface TranscriptData {
  type: string;
  text: string;
}

export type TranscriptCallback = ((text: string) => void) | null;
export type ConnectionStateCallback = ((state: ConnectionState) => void) | null;
export type AudioLevelCallback = ((level: number) => void) | null;

class LiveKitService {
  private room: Room | null = null;
  private audioTrack: LocalAudioTrack | null = null;
  private publishedTrack: LocalTrackPublication | null = null;
  private transcriptCallback: TranscriptCallback | null = null;
  private connectionStateCallback: ConnectionStateCallback | null = null;
  private audioLevelCallback: AudioLevelCallback | null = null;
  private audioLevelInterval: NodeJS.Timeout | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphoneSource: MediaStreamAudioSourceNode | null = null;

  async connect(config: LiveKitConfig): Promise<Room> {
    // Clean up any existing connection
    if (this.room) {
      await this.disconnect();
    }

    const room = new Room({
      // Configure room options
      adaptiveStream: true,
      dynacast: true,
    });
    this.room = room;

    // Set up connection state listener
    this.setupConnectionStateListener(room);

    // Connect to room
    try {
      await room.connect(config.wsUrl, config.token);
      console.log("Connected to LiveKit room:", room.name);
    } catch (error) {
      console.error("Failed to connect to LiveKit:", error);
      throw error;
    }

    // Wait a bit for connection to stabilize
    await new Promise(resolve => setTimeout(resolve, 500));

    // Create and publish audio track
    try {
      // On mobile, ensure we request audio with proper constraints
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        // Add sample rate constraints for better mobile compatibility
        sampleRate: { ideal: 16000 },
        channelCount: { ideal: 1 },
      };

      const audioTrack = await createLocalAudioTrack({
        ...audioConstraints,
      });
      this.audioTrack = audioTrack;
      
      // Monitor audio levels (with delay to ensure track is ready on mobile)
      setTimeout(() => {
        this.startAudioLevelMonitoring(audioTrack);
      }, 100);
      
      const publication = await room.localParticipant.publishTrack(audioTrack, {
        source: Track.Source.Microphone,
      });
      this.publishedTrack = publication;
      console.log("Audio track published successfully");
    } catch (error) {
      console.error("Failed to create/publish audio track:", error);
      throw error;
    }

    // Set up transcription listener
    this.setupTranscriptListener(room);

    return room;
  }

  private setupConnectionStateListener(room: Room): void {
    room.on(RoomEvent.ConnectionStateChanged, (state: ConnectionState) => {
      console.log("Connection state changed:", state);
      this.connectionStateCallback?.(state);
      
      if (state === ConnectionState.Disconnected) {
        console.log("Disconnected from LiveKit room");
      } else if (state === ConnectionState.Connected) {
        console.log("Connected to LiveKit room");
      } else if (state === ConnectionState.Reconnecting) {
        console.log("Reconnecting to LiveKit room...");
      }
    });

    // Add media track error listener
    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      console.log("Track subscribed:", track.kind, participant.identity);
    });

    room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      console.log("Track unsubscribed:", track.kind, participant.identity);
    });

    // Listen for local track publication errors
    room.localParticipant.on("trackPublished", (publication) => {
      console.log("Local track published:", publication.trackSid);
    });

    room.localParticipant.on("trackUnpublished", (publication) => {
      console.log("Local track unpublished:", publication.trackSid);
    });
  }

  private setupTranscriptListener(room: Room): void {
    room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant) => {
      try {
        const text = new TextDecoder().decode(payload);
        console.log("Data received from LiveKit:", text, "Participant:", participant?.identity);
        
        // Try to parse as JSON
        try {
          const transcriptData: TranscriptData = JSON.parse(text);
          
          if (transcriptData.type === "transcript" && transcriptData.text) {
            console.log("Received transcript:", transcriptData.text);
            this.transcriptCallback?.(transcriptData.text);
            return;
          }
        } catch (parseError) {
          // Not JSON, check if it's plain text that might be a transcript
          if (text.trim().length > 0 && (text.includes("transcript") || text.toLowerCase().includes("said") || text.length > 10)) {
            console.log("Received plain text (possibly transcript):", text);
            // Try to extract transcript from various formats
            this.transcriptCallback?.(text);
            return;
          }
        }
      } catch (error) {
        console.error("Error processing data message:", error);
      }
    });
  }

  private startAudioLevelMonitoring(track: LocalAudioTrack): void {
    // Stop any existing monitoring
    this.stopAudioLevelMonitoring();

    if (!track || !track.mediaStreamTrack) {
      return;
    }

    try {
      // Create audio context and analyser
      // Use AudioContext or webkitAudioContext for better mobile compatibility
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn("AudioContext not supported, audio level monitoring disabled");
        return;
      }

      this.audioContext = new AudioContextClass();
      
      // Resume AudioContext if suspended (required on mobile browsers)
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch((error) => {
          console.error("Error resuming AudioContext:", error);
        });
      }

      this.analyser = this.audioContext.createAnalyser();
      this.analyser.smoothingTimeConstant = 0.8;
      this.analyser.fftSize = 256;
      
      const stream = new MediaStream([track.mediaStreamTrack]);
      this.microphoneSource = this.audioContext.createMediaStreamSource(stream);
      this.microphoneSource.connect(this.analyser);

      // Monitor audio levels every 100ms
      this.audioLevelInterval = setInterval(() => {
        if (this.analyser && this.audioContext && this.audioContext.state === 'running') {
          const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
          this.analyser.getByteTimeDomainData(dataArray);
          
          // Calculate RMS (Root Mean Square) for volume
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const normalized = (dataArray[i] - 128) / 128;
            sum += normalized * normalized;
          }
          const rms = Math.sqrt(sum / dataArray.length);
          const normalizedLevel = Math.min(rms * 2, 1); // Amplify and clamp to 0-1
          
          this.audioLevelCallback?.(normalizedLevel);
        } else if (this.audioContext && this.audioContext.state === 'suspended') {
          // Try to resume if suspended
          this.audioContext.resume().catch((error) => {
            console.error("Error resuming suspended AudioContext:", error);
          });
        }
      }, 100);
    } catch (error) {
      console.error("Error setting up audio level monitoring:", error);
    }
  }

  private stopAudioLevelMonitoring(): void {
    if (this.audioLevelInterval) {
      clearInterval(this.audioLevelInterval);
      this.audioLevelInterval = null;
    }

    if (this.microphoneSource) {
      try {
        this.microphoneSource.disconnect();
      } catch (error) {
        // Ignore disconnect errors
      }
      this.microphoneSource = null;
    }

    if (this.audioContext) {
      this.audioContext.close().catch(console.error);
      this.audioContext = null;
    }

    this.analyser = null;
  }

  setTranscriptCallback(callback: TranscriptCallback): void {
    this.transcriptCallback = callback;
  }

  setConnectionStateCallback(callback: ConnectionStateCallback): void {
    this.connectionStateCallback = callback;
  }

  setAudioLevelCallback(callback: AudioLevelCallback): void {
    this.audioLevelCallback = callback;
  }

  getRoomName(): string | null {
    return this.room?.name || null;
  }

  getConnectionState(): ConnectionState | null {
    return this.room?.state || null;
  }

  isConnected(): boolean {
    return this.room?.state === ConnectionState.Connected;
  }

  async disconnect(): Promise<void> {
    // Stop audio level monitoring
    this.stopAudioLevelMonitoring();

    if (this.room) {
      // Unpublish track first
      if (this.publishedTrack?.track) {
        try {
          await this.room.localParticipant.unpublishTrack(
            this.publishedTrack.track
          );
        } catch (error) {
          console.error("Error unpublishing track:", error);
        }
        this.publishedTrack = null;
      }

      // Disconnect from room
      try {
        await this.room.disconnect();
      } catch (error) {
        console.error("Error disconnecting from room:", error);
      }
      this.room = null;
    }

    // Stop the audio track
    if (this.audioTrack) {
      try {
        this.audioTrack.stop();
      } catch (error) {
        console.error("Error stopping audio track:", error);
      }
      this.audioTrack = null;
    }

    // Clear callbacks
    this.transcriptCallback = null;
    this.connectionStateCallback = null;
    this.audioLevelCallback = null;
  }

  cleanup(): void {
    this.disconnect().catch(console.error);
  }
}

export const liveKitService = new LiveKitService();

