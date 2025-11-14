import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Checks if microphone access is available and requests permission if needed.
 * @throws {Error} If microphone access is denied or not available
 */
export async function ensureMicrophoneAccess(): Promise<void> {
  // Check if getUserMedia is available
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error(
      "Microphone access is not available in this browser. Please use a modern browser that supports getUserMedia."
    );
  }

  try {
    // Request microphone permission
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    // Stop the stream immediately - we just needed to check/request permission
    stream.getTracks().forEach((track) => track.stop());
  } catch (error: any) {
    if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
      throw new Error(
        "Microphone permission was denied. Please allow microphone access in your browser settings and try again."
      );
    } else if (error.name === "NotFoundError" || error.name === "DevicesNotFoundError") {
      throw new Error(
        "No microphone found. Please connect a microphone and try again."
      );
    } else if (error.name === "NotReadableError" || error.name === "TrackStartError") {
      throw new Error(
        "Microphone is already in use by another application. Please close other applications using the microphone and try again."
      );
    } else {
      throw new Error(
        `Failed to access microphone: ${error.message || "Unknown error"}`
      );
    }
  }
}
