import { Mic, MicOff, Wifi, WifiOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConnectionState } from "livekit-client";
import { motion } from "framer-motion";

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

  // Calculate animation values based on audio level (0-1)
  const maxScale = 1.8; // Maximum scale multiplier
  const minScale = 1.0;
  const scale = minScale + (audioLevel * (maxScale - minScale));
  const opacity = isMicOn ? 0.2 + (audioLevel * 0.4) : 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:gap-6 w-full px-4">
      <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 text-center">Voice Transcriber</h1>

      {/* Connection Status */}
      {connectionStatus && (
        <div className={`flex items-center gap-2 ${connectionStatus.color}`}>
          {ConnectionIcon && <ConnectionIcon className="w-4 h-4 sm:w-5 sm:h-5" />}
          <span className="text-xs sm:text-sm font-medium">{connectionStatus.text}</span>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 sm:px-4 py-2 rounded-lg max-w-md mx-4">
          <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          <span className="text-xs sm:text-sm break-words">{error}</span>
        </div>
      )}

      {/* Recording Button with Audio Level Animation */}
      <div className="relative flex items-center justify-center">
        {/* Multiple animated concentric circles for audio visualization */}
        {isMicOn && (
          <>
            {/* Outer pulse ring - responsive sizing */}
            <motion.div
              className="absolute rounded-full bg-gradient-to-r from-pink-400 via-red-400 to-pink-500 w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32"
              animate={{
                scale: scale,
                opacity: opacity,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.5,
              }}
            />
            
            {/* Middle pulse ring - responsive sizing */}
            <motion.div
              className="absolute rounded-full bg-gradient-to-r from-pink-300 via-red-300 to-pink-400 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28"
              animate={{
                scale: scale * 0.9,
                opacity: opacity * 0.7,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.5,
                delay: 0.05,
              }}
            />
            
            {/* Inner pulse ring - responsive sizing */}
            <motion.div
              className="absolute rounded-full bg-gradient-to-r from-pink-200 via-red-200 to-pink-300 w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24"
              animate={{
                scale: scale * 0.8,
                opacity: opacity * 0.5,
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
                mass: 0.5,
                delay: 0.1,
              }}
            />
          </>
        )}

        {/* Recording Button */}
        <motion.div
          animate={{
            scale: isMicOn && audioLevel > 0.1 ? 1 + (audioLevel * 0.05) : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 400,
            damping: 25,
          }}
        >
          <Button
            onClick={onToggle}
            disabled={isConnecting}
            size="lg"
            className={`w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full relative z-10 bg-white hover:bg-white ${isConnecting ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
          >
            {isMicOn ? (
              <MicOff className="text-pink-500 size-[40px] sm:size-[45px] md:size-[50px]" />
            ) : (
              <Mic className="text-pink-500 size-[40px] sm:size-[45px] md:size-[50px]" />
            )}
          </Button>
        </motion.div>
      </div>

      {/* Status Text */}
      <p className="text-sm sm:text-base md:text-lg text-gray-600 text-center px-4">
        {isConnecting
          ? "Connecting..."
          : isMicOn
          ? "Recording... Click to stop"
          : "Click to start recording"}
      </p>
    </div>
  );
}

