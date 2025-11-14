import { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
  className?: string;
}

export function AuthCard({ children, className = "" }: AuthCardProps) {
  return (
    <div className={`w-full max-w-md bg-white rounded-lg shadow-lg p-6 sm:p-8 space-y-4 sm:space-y-6 ${className}`}>
      {children}
    </div>
  );
}

