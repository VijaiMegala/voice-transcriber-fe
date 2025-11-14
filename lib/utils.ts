import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { DictionaryItem } from "@/services/api.service"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Checks if microphone access is available and requests permission if needed.
 * @throws {Error} If microphone access is denied or not available
 */
export async function ensureMicrophoneAccess(): Promise<void> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    const getUserMedia = 
      (navigator as any).getUserMedia ||
      (navigator as any).webkitGetUserMedia ||
      (navigator as any).mozGetUserMedia ||
      (navigator as any).msGetUserMedia;
    
    if (!getUserMedia) {
      throw new Error(
        "Microphone access is not available in this browser. Please use a modern browser that supports getUserMedia."
      );
    }
  }

  try {
    const audioConstraints: MediaStreamConstraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        sampleRate: { ideal: 16000 },
        channelCount: { ideal: 1 },
      },
    };

    const stream = await navigator.mediaDevices.getUserMedia(audioConstraints);
    
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
    } else if (error.name === "OverconstrainedError") {
      try {
        const basicStream = await navigator.mediaDevices.getUserMedia({ audio: true });
        basicStream.getTracks().forEach((track) => track.stop());
        return;
      } catch (retryError: any) {
        throw new Error(
          `Failed to access microphone: ${retryError.message || "Unknown error"}`
        );
      }
    } else {
      throw new Error(
        `Failed to access microphone: ${error.message || "Unknown error"}`
      );
    }
  }
}

/**
 * Replaces words in transcript text based on dictionary entries.
 * Performs case-insensitive matching while preserving original case.
 * Handles word boundaries to avoid partial matches.
 * 
 * @param text - The transcript text to process
 * @param dictionaryEntries - Array of dictionary entries with currentWord and replacementWord
 * @returns The text with dictionary replacements applied
 */
export function replaceWordsWithDictionary(
  text: string,
  dictionaryEntries: DictionaryItem[]
): string {
  if (!text || !text.trim() || !dictionaryEntries || dictionaryEntries.length === 0) {
    return text;
  }

  let result = text;

  const sortedEntries = [...dictionaryEntries].sort(
    (a, b) => b.currentWord.length - a.currentWord.length
  );

  for (const entry of sortedEntries) {
    const currentWord = entry.currentWord.trim();
    const replacementWord = entry.replacementWord.trim();

    if (!currentWord || !replacementWord) {
      continue;
    }

    const regex = new RegExp(
      `\\b${currentWord.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`,
      "gi"
    );

    result = result.replace(regex, (match) => {
      if (match === match.toUpperCase()) {
        return replacementWord.toUpperCase();
      } else if (match[0] === match[0].toUpperCase()) {
        return replacementWord.charAt(0).toUpperCase() + replacementWord.slice(1).toLowerCase();
      } else {
        return replacementWord;
      }
    });
  }

  return result;
}
