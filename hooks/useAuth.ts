"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const accessToken = localStorage.getItem("accessToken");
    const isAuth = !!accessToken;

    setIsAuthenticated(isAuth);
    setIsLoading(false);
  }, []);

  const logout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("user");
    router.push("/auth");
  };

  const getAccessToken = () => {
    if (typeof window === "undefined") {
      return null;
    }
    return localStorage.getItem("accessToken");
  };

  const getUser = () => {
    if (typeof window === "undefined") {
      return null;
    }
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  };

  return {
    isAuthenticated,
    isLoading,
    logout,
    getAccessToken,
    getUser,
  };
}

