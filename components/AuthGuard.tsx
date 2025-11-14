"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Wait for client-side to check localStorage
    if (typeof window === "undefined") {
      return;
    }

    const accessToken = localStorage.getItem("accessToken");
    const isAuthPage = pathname === "/auth";

    // If on auth page and already authenticated, redirect to home
    if (isAuthPage && accessToken) {
      router.push("/home");
      return;
    }

    // If not on auth page and not authenticated, redirect to auth
    if (!isAuthPage && !accessToken) {
      router.push("/auth");
      return;
    }

    setIsChecking(false);
  }, [pathname, router]);

  // Don't render children if on auth page (auth page handles its own rendering)
  if (pathname === "/auth") {
    return null;
  }

  // Show nothing while checking (prevents flash of content)
  if (isChecking) {
    return null;
  }

  const accessToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  
  // If still no token after check, don't render
  if (!accessToken) {
    return null;
  }

  return <>{children}</>;
}

