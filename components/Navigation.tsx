"use client";

import Link from "next/link";
import Image from "next/image";
import { PersonStanding, LogOut, Menu, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import { useEffect, useState } from "react";

interface NavigationProps {
  className?: string;
}

export function Navigation({ className = "" }: NavigationProps) {
  const { logout, getUser } = useAuth();
  const [username, setUsername] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (user?.username) {
      setUsername(user.username);
    }
  }, [getUser]);

  return (
    <div className={`w-full flex flex-col items-center p-2 sm:p-4 ${className}`}>
      <nav className="w-full sm:w-[80%] bg-white/80 backdrop-blur-sm rounded-lg flex gap-2 sm:gap-4">
        <div className="flex w-full px-2 sm:px-4">
          <div className="flex items-center justify-center">
            <Image src="/voice.svg" alt="Logo" width={30} height={30} className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="hidden md:flex items-center justify-center w-full px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex justify-around w-full gap-2 sm:gap-4">
              <Link
                href="/home"
                className="text-sm sm:text-md font-medium text-gray-700 transition-colors hover:opacity-50"
              >
                Home
              </Link>
              <Link
                href="/history"
                className="text-sm sm:text-md font-medium text-gray-700 transition-colors hover:opacity-50"
              >
                History
              </Link>
              <Link
                href="/dictionary"
                className="text-sm sm:text-md font-medium text-gray-700 transition-colors hover:opacity-50"
              >
                Dictionary
              </Link>
              <Link
                href=""
                className="text-sm sm:text-md font-medium text-gray-700 transition-colors hover:opacity-50"
              >
                Settings
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center ml-auto gap-2">
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5 text-gray-700" />
                ) : (
                  <Menu className="h-5 w-5 text-gray-700" />
                )}
              </Button>
            </div>
            <Tooltip>
              <DropdownMenu>
                <TooltipTrigger asChild>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full cursor-pointer"
                      aria-label="User menu"
                    >
                      <PersonStanding className="size-[18px] sm:size-[20px] text-gray-700" />
                    </Button>
                  </DropdownMenuTrigger>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{username || "User"}</p>
                </TooltipContent>
                <DropdownMenuContent className="mt-2" align="end">
                  <DropdownMenuItem onClick={logout} className="cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </Tooltip>
          </div>
        </div>
      </nav>
      {isMobileMenuOpen && (
        <div className="md:hidden w-full sm:w-[80%] mt-2 bg-white/80 backdrop-blur-sm rounded-lg px-4 py-3 shadow-lg">
          <div className="flex flex-col gap-3">
            <Link
              href="/home"
              className="text-sm font-medium text-gray-700 transition-colors hover:opacity-50 py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/history"
              className="text-sm font-medium text-gray-700 transition-colors hover:opacity-50 py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              History
            </Link>
            <Link
              href="/dictionary"
              className="text-sm font-medium text-gray-700 transition-colors hover:opacity-50 py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Dictionary
            </Link>
            <Link
              href=""
              className="text-sm font-medium text-gray-700 transition-colors hover:opacity-50 py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Settings
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

