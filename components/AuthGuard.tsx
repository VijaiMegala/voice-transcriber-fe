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
    if (typeof window === "undefined") {
      return;
    }

    const accessToken = localStorage.getItem("accessToken");
    const isAuthPage = pathname === "/auth";

    if (isAuthPage && accessToken) {
      router.push("/home");
      return;
    }

    if (!isAuthPage && !accessToken) {
      router.push("/auth");
      return;
    }

    setIsChecking(false);
  }, [pathname, router]);

  if (pathname === "/auth") {
    return null;
  }

  if (isChecking) {
    return null;
  }

  const accessToken = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;
  
  if (!accessToken) {
    return null;
  }

  return <>{children}</>;
}

