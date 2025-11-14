"use client";

import { ReactNode } from "react";
import { Navigation } from "./Navigation";
import { AuthGuard } from "./AuthGuard";

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
}

export function PageLayout({ children, className = "" }: PageLayoutProps) {
  return (
    <AuthGuard>
      <div className={`flex min-h-screen flex-col bg-pink-100 font-sans ${className}`}>
        <Navigation />
        <main className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-4 sm:px-6 md:px-[8%] py-4 sm:py-6 md:py-8 gap-4 sm:gap-6 md:gap-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}

