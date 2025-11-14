"use client";

import { AnimatedWrapper } from "./AnimatedWrapper";

interface LiveTranscriptProps {
  transcript: string;
}

export function LiveTranscript({ transcript }: LiveTranscriptProps) {
  return (
    <AnimatedWrapper
      animation="slide-up"
      delay={100}
      duration={600}
      trigger={true}
      className="w-full max-w-4xl mt-4 sm:mt-6 md:mt-8"
    >
      <div className="bg-white rounded-lg shadow-lg p-4 sm:p-5 md:p-6 transform transition-all duration-300 hover:shadow-xl">
        <AnimatedWrapper animation="fade" delay={200} duration={400}>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
            <span className="inline-block w-2 h-2 bg-pink-500 rounded-full animate-pulse"></span>
            Live Transcript
          </h2>
        </AnimatedWrapper>
        <AnimatedWrapper animation="fade" delay={300} duration={400} animationKey={transcript.length}>
          <div className="min-h-[150px] sm:min-h-[200px] max-h-[300px] sm:max-h-[400px] overflow-y-auto p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200 scroll-smooth">
            {transcript ? (
              <p className="text-sm sm:text-base text-gray-700 whitespace-pre-wrap leading-relaxed">
                {transcript}
              </p>
            ) : (
              <p className="text-sm sm:text-base text-gray-400 italic animate-pulse">
                Listening... Speak into your microphone.
              </p>
            )}
          </div>
        </AnimatedWrapper>
      </div>
    </AnimatedWrapper>
  );
}

