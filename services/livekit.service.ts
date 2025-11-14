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
    if (this.room) {
      await this.disconnect();
    }

    const room = new Room({
      adaptiveStream: true,
      dynacast: true,
    });
    this.room = room;

    this.setupConnectionStateListener(room);

    try {
      await room.connect(config.wsUrl, config.token);
      console.log("Connected to LiveKit room:", room.name);
    } catch (error) {
      console.error("Failed to connect to LiveKit:", error);
      throw error;
    }

    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const audioConstraints: MediaTrackConstraints = {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: { ideal: 16000 },
        channelCount: { ideal: 1 },
      };

      const audioTrack = await createLocalAudioTrack({
        ...audioConstraints,
      });
      this.audioTrack = audioTrack;
      
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

    room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      console.log("Track subscribed:", track.kind, participant.identity);
    });

    room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      console.log("Track unsubscribed:", track.kind, participant.identity);
    });

    room.localParticipant.on("trackPublished", (publication) => {
      console.log("Local track published:", publication.trackSid);
    });

    room.localParticipant.on("trackUnpublished", (publication) => {
      console.log("Local track unpublished:", publication.trackSid);
    });
  }

  private setupTranscriptListener(room: Room): void {
    room.on(RoomEvent.DataReceived, (payload: Uint8Array, participant?: RemoteParticipant, kind?: any, topic?: string) => {
      try {
        const text = new TextDecoder().decode(payload);
        console.log("Data received from LiveKit:", text, "Participant:", participant?.identity, "Topic:", topic);
        
        try {
          const transcriptData: TranscriptData = JSON.parse(text);
          
          if (transcriptData.type === "transcript" && transcriptData.text) {
            console.log("Received transcript (JSON):", transcriptData.text);
            this.transcriptCallback?.(transcriptData.text);
            return;
          }
        } catch (parseError) {
          if (text.trim().length > 0) {
            if (text.length > 3 && !text.startsWith("{") && !text.startsWith("[") && !text.includes("error")) {
              console.log("Received plain text (possibly transcript):", text);
              this.transcriptCallback?.(text.trim());
              return;
            }
          }
        }
      } catch (error) {
        console.error("Error processing data message:", error);
      }
    });

    room.on(RoomEvent.ParticipantConnected, (participant: RemoteParticipant) => {
      console.log("Remote participant connected:", participant.identity, participant.name);
      
      participant.on("dataReceived", (payload: Uint8Array, kind?: any) => {
        try {
          const text = new TextDecoder().decode(payload);
          console.log("Data received from participant:", participant.identity, "Text:", text, "Kind:", kind);
          
          try {
            const transcriptData: TranscriptData = JSON.parse(text);
            if (transcriptData.type === "transcript" && transcriptData.text) {
              console.log("Received transcript from participant:", transcriptData.text);
              this.transcriptCallback?.(transcriptData.text);
              return;
            }
          } catch (parseError) {
            if (text.trim().length > 3 && !text.startsWith("{") && !text.startsWith("[")) {
              console.log("Received plain text transcript from participant:", text);
              this.transcriptCallback?.(text.trim());
            }
          }
        } catch (error) {
          console.error("Error processing participant data:", error);
        }
      });
    });

    room.remoteParticipants.forEach((participant) => {
      console.log("Found existing remote participant:", participant.identity);
      participant.on("dataReceived", (payload: Uint8Array, kind?: any) => {
        try {
          const text = new TextDecoder().decode(payload);
          console.log("Data from existing participant:", participant.identity, "Text:", text);
          
          try {
            const transcriptData: TranscriptData = JSON.parse(text);
            if (transcriptData.type === "transcript" && transcriptData.text) {
              this.transcriptCallback?.(transcriptData.text);
              return;
            }
          } catch (parseError) {
            if (text.trim().length > 3 && !text.startsWith("{") && !text.startsWith("[")) {
              this.transcriptCallback?.(text.trim());
            }
          }
        } catch (error) {
          console.error("Error processing existing participant data:", error);
        }
      });
    });
  }

  private startAudioLevelMonitoring(track: LocalAudioTrack): void {
    this.stopAudioLevelMonitoring();

    if (!track || !track.mediaStreamTrack) {
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        console.warn("AudioContext not supported, audio level monitoring disabled");
        return;
      }

      this.audioContext = new AudioContextClass();
      
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

      this.audioLevelInterval = setInterval(() => {
        if (this.analyser && this.audioContext && this.audioContext.state === 'running') {
          const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
          this.analyser.getByteTimeDomainData(dataArray);
          
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const normalized = (dataArray[i] - 128) / 128;
            sum += normalized * normalized;
          }
          const rms = Math.sqrt(sum / dataArray.length);
          const normalizedLevel = Math.min(rms * 2, 1);
          
          this.audioLevelCallback?.(normalizedLevel);
        } else if (this.audioContext && this.audioContext.state === 'suspended') {
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
    this.stopAudioLevelMonitoring();

    if (this.room) {
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

      try {
        await this.room.disconnect();
      } catch (error) {
        console.error("Error disconnecting from room:", error);
      }
      this.room = null;
    }

    if (this.audioTrack) {
      try {
        this.audioTrack.stop();
      } catch (error) {
        console.error("Error stopping audio track:", error);
      }
      this.audioTrack = null;
    }

    this.transcriptCallback = null;
    this.connectionStateCallback = null;
    this.audioLevelCallback = null;
  }

  cleanup(): void {
    this.disconnect().catch(console.error);
  }
}

export const liveKitService = new LiveKitService();

