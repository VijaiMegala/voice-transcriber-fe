import { Mic, MicOff, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectionState } from "livekit-client";

interface RecordingButtonProps {
  isMicOn: boolean;
  isConnecting: boolean;
  connectionState: ConnectionState | null;
  audioLevel: number;
  error: string | null;
  onToggle: () => void;
}

export function RecordingButton({
  isMicOn,
  isConnecting,
  connectionState,
  audioLevel,
  error,
  onToggle,
}: RecordingButtonProps) {
  const getConnectionStatus = () => {
    if (!connectionState) return null;
    if (connectionState === ConnectionState.Connected) {
      return { text: "Connected", icon: Wifi, color: "text-green-600" };
    }
    if (connectionState === ConnectionState.Reconnecting) {
      return { text: "Reconnecting...", icon: WifiOff, color: "text-yellow-600" };
    }
    return { text: "Disconnected", icon: WifiOff, color: "text-red-600" };
  };

  const connectionStatus = getConnectionStatus();
  const ConnectionIcon = connectionStatus?.icon;

  // Calculate pulse size based on audio level (0-1)
  const pulseSize = 32 + audioLevel * 40; // 32px to 72px

  return (
    <div className="flex flex-col items-center gap-6">
      <h1 className="text-4xl font-bold text-gray-800">Voice Transcriber</h1>

      {/* Connection Status */}
      {connectionStatus && (
        <div className={`flex items-center gap-2 ${connectionStatus.color}`}>
          {ConnectionIcon && <ConnectionIcon className="w-5 h-5" />}
          <span className="text-sm font-medium">{connectionStatus.text}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-4 py-2 rounded-lg max-w-md">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {/* Recording Button with Audio Level Indicator */}
      <div className="relative flex items-center justify-center">
        {/* Audio level pulse effect */}
        {isMicOn && audioLevel > 0.1 && (
          <div
            className="absolute rounded-full bg-red-400 opacity-30 animate-pulse"
            style={{
              width: `${pulseSize}px`,
              height: `${pulseSize}px`,
              transition: "width 0.1s, height 0.1s",
            }}
          />
        )}

        <Button
          onClick={onToggle}
          disabled={isConnecting}
          size="lg"
          className={`w-32 h-32 rounded-full relative z-10 bg-white hover:bg-white ${isConnecting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        >
          {isMicOn ? (
            <MicOff className="text-pink-500 size-[50px]" />
          ) : (
            <Mic className="text-pink-500 size-[50px]" />
          )}
        </Button>
      </div>

      {/* Status Text */}
      <p className="text-lg text-gray-600">
        {isConnecting
          ? "Connecting..."
          : isMicOn
          ? "Recording... Click to stop"
          : "Click to start recording"}
      </p>

      {/* Audio Level Indicator */}
      {isMicOn && (
        <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-100"
            style={{ width: `${audioLevel * 100}%` }}
          />
        </div>
      )}
    </div>
  );
}

