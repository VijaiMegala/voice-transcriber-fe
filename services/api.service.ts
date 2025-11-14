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

export interface CreateTranscriptDto {
  transcript: string;
}

export interface UpdateTranscriptDto {
  transcript?: string;
  transcriptName?: string;
}

export interface RenameTranscriptDto {
  transcriptName: string;
}

export interface TranscriptItem {
  transcriptId: number;
  transcriptName: string;
  transcript: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface TranscriptListResponse {
  transcripts: TranscriptItem[];
  total: number;
  offset: number;
  limit: number;
}

export interface GetTranscriptsQuery {
  offset?: number;
  limit?: number;
}

export interface CreateDictionaryDto {
  currentWord: string;
  replacementWord: string;
}

export interface UpdateDictionaryDto {
  currentWord?: string;
  replacementWord?: string;
}

export interface DictionaryItem {
  wordId: number;
  currentWord: string;
  replacementWord: string;
  userId: string;
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
    const response = await fetch(`${API_BASE_URL}/livekit/transcript`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 401) {
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
    const response = await fetch(`${API_BASE_URL}/livekit/transcript/final`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 401) {
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

  async createTranscript(request: CreateTranscriptDto): Promise<TranscriptItem> {
    if (!request.transcript || !request.transcript.trim()) {
      throw new Error("Transcript cannot be empty");
    }

    const response = await fetch(`${API_BASE_URL}/transcript`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify({
        transcript: request.transcript.trim(),
      }),
    });

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        }
        throw new Error("Authentication required. Please sign in again.");
      }
      
      const errorData = await response.json().catch(() => ({ 
        message: "Failed to create transcript",
        error: "Bad Request",
        statusCode: response.status
      }));
      
      if (errorData.message && Array.isArray(errorData.message)) {
        throw new Error(errorData.message.join(", "));
      }
      
      throw new Error(errorData.message || "Failed to create transcript");
    }

    return response.json();
  }

  async getAllTranscripts(query?: GetTranscriptsQuery): Promise<TranscriptListResponse> {
    const params = new URLSearchParams();
    if (query?.offset !== undefined) params.append("offset", query.offset.toString());
    if (query?.limit !== undefined) params.append("limit", query.limit.toString());

    const url = `${API_BASE_URL}/transcript${params.toString() ? `?${params.toString()}` : ""}`;
    const response = await fetch(url, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        }
        throw new Error("Authentication required. Please sign in again.");
      }
      throw new Error("Failed to get transcripts");
    }

    return response.json();
  }

  async getTranscript(transcriptId: number): Promise<TranscriptItem> {
    const response = await fetch(`${API_BASE_URL}/transcript/${transcriptId}`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        }
        throw new Error("Authentication required. Please sign in again.");
      }
      const error = await response.json().catch(() => ({ message: "Failed to get transcript" }));
      throw new Error(error.message || "Failed to get transcript");
    }

    return response.json();
  }

  async updateTranscript(transcriptId: number, request: UpdateTranscriptDto): Promise<TranscriptItem> {
    const response = await fetch(`${API_BASE_URL}/transcript/${transcriptId}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        }
        throw new Error("Authentication required. Please sign in again.");
      }
      const error = await response.json().catch(() => ({ message: "Failed to update transcript" }));
      throw new Error(error.message || "Failed to update transcript");
    }

    return response.json();
  }

  async renameTranscript(transcriptId: number, request: RenameTranscriptDto): Promise<TranscriptItem> {
    const response = await fetch(`${API_BASE_URL}/transcript/${transcriptId}/rename`, {
      method: "PATCH",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        }
        throw new Error("Authentication required. Please sign in again.");
      }
      const error = await response.json().catch(() => ({ message: "Failed to rename transcript" }));
      throw new Error(error.message || "Failed to rename transcript");
    }

    return response.json();
  }

  async deleteTranscript(transcriptId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/transcript/${transcriptId}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        }
        throw new Error("Authentication required. Please sign in again.");
      }
      const error = await response.json().catch(() => ({ message: "Failed to delete transcript" }));
      throw new Error(error.message || "Failed to delete transcript");
    }
  }

  async getAllDictionaryEntries(): Promise<DictionaryItem[]> {
    const response = await fetch(`${API_BASE_URL}/dictionary`, {
      method: "GET",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        }
        throw new Error("Authentication required. Please sign in again.");
      }
      throw new Error("Failed to get dictionary entries");
    }

    return response.json();
  }

  async createDictionaryEntry(request: CreateDictionaryDto): Promise<DictionaryItem> {
    const response = await fetch(`${API_BASE_URL}/dictionary`, {
      method: "POST",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        }
        throw new Error("Authentication required. Please sign in again.");
      }
      const error = await response.json().catch(() => ({ message: "Failed to create dictionary entry" }));
      if (error.message && Array.isArray(error.message)) {
        throw new Error(error.message.join(", "));
      }
      throw new Error(error.message || "Failed to create dictionary entry");
    }

    return response.json();
  }

  async updateDictionaryEntry(wordId: number, request: UpdateDictionaryDto): Promise<DictionaryItem> {
    const response = await fetch(`${API_BASE_URL}/dictionary/${wordId}`, {
      method: "PUT",
      headers: this.getAuthHeaders(),
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        }
        throw new Error("Authentication required. Please sign in again.");
      }
      const error = await response.json().catch(() => ({ message: "Failed to update dictionary entry" }));
      if (error.message && Array.isArray(error.message)) {
        throw new Error(error.message.join(", "));
      }
      throw new Error(error.message || "Failed to update dictionary entry");
    }

    return response.json();
  }

  async deleteDictionaryEntry(wordId: number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/dictionary/${wordId}`, {
      method: "DELETE",
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("user");
        }
        throw new Error("Authentication required. Please sign in again.");
      }
      const error = await response.json().catch(() => ({ message: "Failed to delete dictionary entry" }));
      throw new Error(error.message || "Failed to delete dictionary entry");
    }
  }
}

export const apiService = new ApiService();

