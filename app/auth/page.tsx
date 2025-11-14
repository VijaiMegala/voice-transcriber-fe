"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { AuthCard } from "@/components/auth/AuthCard";
import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthFormField } from "@/components/auth/AuthFormField";
import { AuthError } from "@/components/auth/AuthError";
import { AuthToggle } from "@/components/auth/AuthToggle";
import { apiService } from "@/services/api.service";

type AuthMode = "signin" | "signup";

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("signin");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      let response;
      if (mode === "signup") {
        if (!username.trim() || username.length < 3) {
          setError("Username must be at least 3 characters");
          setLoading(false);
          return;
        }
        response = await apiService.signUp({
          username: username.trim(),
          email: email.trim(),
          password,
        });
      } else {
        response = await apiService.signIn({
          email: email.trim(),
          password,
        });
      }

      // Store token in localStorage
      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("user", JSON.stringify(response.user));

      // Redirect to home page
      router.push("/home");
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setError(null);
    setEmail("");
    setPassword("");
    setUsername("");
  };

  const authConfig = {
    signin: {
      title: "Sign In",
      description: "Enter your credentials to access your account",
      buttonText: "Sign In",
    },
    signup: {
      title: "Sign Up",
      description: "Create a new account to get started",
      buttonText: "Sign Up",
    },
  };

  const config = authConfig[mode];

  return (
    <AuthLayout>
      <AuthCard>
        <AuthHeader title={config.title} description={config.description} />

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <AuthFormField
              id="username"
              label="Username"
              type="text"
              placeholder="johndoe"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              disabled={loading}
            />
          )}

          <AuthFormField
            id="email"
            label="Email"
            type="email"
            placeholder="john.doe@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
          />

          <AuthFormField
            id="password"
            label="Password"
            type="password"
            placeholder={mode === "signup" ? "At least 6 characters" : "Enter your password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={mode === "signup" ? 6 : undefined}
            disabled={loading}
          />

          <AuthError message={error || ""} />

          <Button
            type="submit"
            className="w-full bg-pink-600 hover:bg-pink-700 text-white"
            disabled={loading}
          >
            {loading ? "Please wait..." : config.buttonText}
          </Button>
        </form>

        <AuthToggle mode={mode} onToggle={toggleMode} disabled={loading} />
      </AuthCard>
    </AuthLayout>
  );
}

