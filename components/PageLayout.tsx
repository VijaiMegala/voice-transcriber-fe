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
        <main className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] px-[8%] py-8 gap-8">
          {children}
        </main>
      </div>
    </AuthGuard>
  );
}

