import { ReactNode } from "react";

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-pink-100 px-4 sm:px-6 py-6 sm:py-8">
      {children}
    </div>
  );
}

