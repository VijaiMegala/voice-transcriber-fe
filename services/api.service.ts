const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

export interface LiveKitTokenRequest {
  roomName: string;
  participantName: string;
}

export interface LiveKitTokenResponse {
  token: string;
  roomName: string;
}

export interface TranscriptRequest {
  roomName: string;
  transcript: string;
}

export interface TranscriptResponse {
  success: boolean;
  processed?: string;
}

export interface FinalTranscriptRequest {
  roomName: string;
}

export interface FinalTranscriptResponse {
  transcript: string;
}

export interface SignUpRequest {
  username: string;
  email: string;
  password: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  expiresAt: string;
  user: {
    userId: string;
    username: string;
    email: string;
  };
}

export interface UserProfile {
  userId: string;
  username: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

class ApiService {
  private getAuthToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  }

  private getAuthHeaders(): HeadersInit {
    const token = this.getAuthToken();
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    return headers;
  }
  async getLiveKitToken(
    request: LiveKitTokenRequest
  ): Promise<LiveKitTokenResponse> {
    const response = await fetch(`${API_BASE_URL}/livekit/token`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Clear invalid token
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        }
        throw new Error("Authentication required. Please sign in again.");
      }
      throw new Error("Failed to get LiveKit token");
    }

    return response.json();
  }

  async sendTranscriptChunk(
    request: TranscriptRequest
  ): Promise<TranscriptResponse> {
    const response = await fetch(`${API_BASE_URL}/transcript`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Clear invalid token
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        }
        throw new Error("Authentication required. Please sign in again.");
      }
      throw new Error("Failed to send transcript chunk");
    }

    return response.json();
  }

  async getFinalTranscript(
    request: FinalTranscriptRequest
  ): Promise<FinalTranscriptResponse> {
    const response = await fetch(`${API_BASE_URL}/transcript/final`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Clear invalid token
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        }
        throw new Error("Authentication required. Please sign in again.");
      }
      throw new Error("Failed to get final transcript");
    }

    return response.json();
  }

  async signUp(request: SignUpRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to sign up" }));
      // Handle validation errors
      if (error.message && Array.isArray(error.message)) {
        throw new Error(error.message.join(", "));
      }
      throw new Error(error.message || "Failed to sign up");
    }

    return response.json();
  }

  async signIn(request: SignInRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/signin`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Failed to sign in" }));
      // Handle validation errors
      if (error.message && Array.isArray(error.message)) {
        throw new Error(error.message.join(", "));
      }
      throw new Error(error.message || "Failed to sign in");
    }

    return response.json();
  }

  async getProfile(): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/auth/profile`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Clear invalid token
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        }
        throw new Error("Authentication required. Please sign in again.");
      }
      throw new Error("Failed to get user profile");
    }

    return response.json();
  }
}

export const apiService = new ApiService();

