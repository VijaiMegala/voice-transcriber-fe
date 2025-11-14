"use client";

import { ReactNode, useEffect, useState } from "react";
import { cn } from "@/lib/utils";

type AnimationType = "fade" | "slide-up" | "slide-down" | "slide-left" | "slide-right" | "scale" | "bounce" | "zoom";

interface AnimatedWrapperProps {
  children: ReactNode;
  animation?: AnimationType;
  delay?: number;
  duration?: number;
  className?: string;
  trigger?: boolean; // Control when animation triggers
  animationKey?: string | number; // Key to force re-animation when content changes
}

const animationClasses: Record<AnimationType, { initial: string; animate: string }> = {
  fade: {
    initial: "opacity-0",
    animate: "opacity-100",
  },
  "slide-up": {
    initial: "opacity-0 translate-y-8",
    animate: "opacity-100 translate-y-0",
  },
  "slide-down": {
    initial: "opacity-0 -translate-y-8",
    animate: "opacity-100 translate-y-0",
  },
  "slide-left": {
    initial: "opacity-0 translate-x-8",
    animate: "opacity-100 translate-x-0",
  },
  "slide-right": {
    initial: "opacity-0 -translate-x-8",
    animate: "opacity-100 translate-x-0",
  },
  scale: {
    initial: "opacity-0 scale-95",
    animate: "opacity-100 scale-100",
  },
  bounce: {
    initial: "opacity-0 scale-90",
    animate: "opacity-100 scale-100",
  },
  zoom: {
    initial: "opacity-0 scale-50",
    animate: "opacity-100 scale-100",
  },
};

export function AnimatedWrapper({
  children,
  animation = "fade",
  delay = 0,
  duration = 500,
  className,
  trigger = true,
  animationKey,
}: AnimatedWrapperProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!trigger) {
      setIsVisible(false);
      return;
    }

    setIsVisible(false);
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [trigger, delay, animationKey]); // Include animationKey in dependencies to re-animate on content change

  const animConfig = animationClasses[animation];

  return (
    <div
      className={cn(
        "transition-all ease-out",
        isVisible ? animConfig.animate : animConfig.initial,
        className
      )}
      style={{
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
      }}
    >
      {children}
    </div>
  );
}

