"use client";

import Link from "next/link";
import Image from "next/image";
import { PersonStanding, LogOut } from "lucide-react";
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

  useEffect(() => {
    const user = getUser();
    if (user?.username) {
      setUsername(user.username);
    }
  }, [getUser]);

  return (
    <div className={`w-full flex justify-center p-4 ${className}`}>
      <nav className="w-[80%] bg-white/80 backdrop-blur-sm rounded-lg flex gap-4">
      <div className="flex w-full px-4">
        <div className="flex items-center justify-center">
          <Image src="/voice.svg" alt="Logo" width={30} height={30} />
        </div>
        <div className="flex items-center justify-center w-full px-6 py-4">
          <div className="flex justify-around w-full gap-4">
            <Link
              href="/home"
              className="text-md font-medium text-gray-700 transition-colors hover:opacity-50"
            >
              Home
            </Link>
            <Link
              href="/dictionary"
              className="text-md font-medium text-gray-700 transition-colors hover:opacity-50"
            >
              Dictionary
            </Link>
            <Link
              href="/Settings"
              className="text-md font-medium text-gray-700 transition-colors hover:opacity-50"
            >
              Settings
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-center">
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
                    <PersonStanding className="size-[20px] text-gray-700" />
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
    </div>
  );
}

