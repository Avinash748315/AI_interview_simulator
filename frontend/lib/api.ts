const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("clarivo_token");
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) {
    localStorage.setItem("clarivo_token", token);
  } else {
    localStorage.removeItem("clarivo_token");
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has("Authorization") && token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  // Do not set Content-Type if body is FormData
  if (!(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const url = `${API_BASE}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    setToken(null);
    if (typeof window !== "undefined" && !window.location.pathname.includes("/login")) {
      window.location.href = "/login";
    }
  }

  if (!response.ok) {
    let errorDetail = "An unexpected error occurred.";
    try {
      const errorJson = await response.json();
      if (typeof errorJson.detail === "string") {
        errorDetail = errorJson.detail;
      } else if (typeof errorJson.detail?.message === "string") {
        errorDetail = errorJson.detail.message;
      } else if (errorJson.message) {
        errorDetail = errorJson.message;
      }
    } catch {
      errorDetail = `Request failed with status ${response.status}`;
    }
    throw new Error(errorDetail);
  }

  // Check if response is empty
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return (await response.json()) as T;
  }
  return (await response.blob()) as unknown as T;
}

export const api = {
  auth: {
    register: (body: { full_name: string; email: string; password: string }) =>
      request<{ access_token: string; user: any }>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    login: (body: { email: string; password: string }) =>
      request<{ access_token: string; user: any }>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    logout: () =>
      request<{ ok: boolean }>("/api/auth/logout", {
        method: "POST",
      }),
    me: () => request<any>("/api/auth/me"),
  },

  profile: {
    get: () => request<any>("/api/profile"),
    update: (body: any) =>
      request<any>("/api/profile", {
        method: "PUT",
        body: JSON.stringify(body),
      }),
  },

  resumes: {
    upload: (file: File) => {
      const formData = new FormData();
      formData.append("file", file);
      return request<any>("/api/resumes/upload", {
        method: "POST",
        body: formData,
      });
    },
    list: () => request<any[]>("/api/resumes"),
    latest: () => request<any | null>("/api/resumes/latest"),
    get: (id: number) => request<any>(`/api/resumes/${id}`),
    delete: (id: number) =>
      request<{ ok: boolean }>(`/api/resumes/${id}`, {
        method: "DELETE",
      }),
  },

  interviews: {
    catalog: () => request<any>("/api/interviews/catalog"),
    create: (body: {
      level: string;
      role: string;
      company: string;
      duration_minutes: number;
      resume_id?: number | null;
    }) =>
      request<any>("/api/interviews", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    active: () => request<any | null>("/api/interviews/active"),
    get: (sessionId: number) => request<any>(`/api/interviews/${sessionId}`),
    start: (sessionId: number) =>
      request<any>(`/api/interviews/${sessionId}/start`, {
        method: "POST",
      }),
    answer: (sessionId: number, questionId: number, transcript: string, edited = false) =>
      request<any>(`/api/interviews/${sessionId}/answer`, {
        method: "POST",
        body: JSON.stringify({
          session_id: sessionId,
          question_id: questionId,
          transcript,
          edited,
        }),
      }),
    skip: (sessionId: number, questionId: number) =>
      request<any>(`/api/interviews/${sessionId}/skip`, {
        method: "POST",
        body: JSON.stringify({
          session_id: sessionId,
          question_id: questionId,
        }),
      }),
    end: (sessionId: number) =>
      request<{ report_id: number | null; status: string; overall_score: number | null }>(
        `/api/interviews/${sessionId}/end`,
        {
          method: "POST",
        }
      ),
    history: () => request<any[]>("/api/interviews/history"),
  },

  reports: {
    get: (reportId: number) => request<any>(`/api/reports/${reportId}`),
    getBySession: (sessionId: number) => request<any>(`/api/reports/session/${sessionId}`),
    studyGuide: (reportId: number) => request<any>(`/api/reports/${reportId}/study-guide`),
    downloadPdfUrl: (reportId: number) => `${API_BASE}/api/reports/${reportId}/pdf`,
  },

  dashboard: {
    get: () => request<any>("/api/dashboard"),
  },

  speech: {
    config: () => request<any>("/api/speech/config"),
    tts: (text: string) =>
      request<Blob>("/api/speech/tts", {
        method: "POST",
        body: JSON.stringify({ text }),
      }),
  },

  payments: {
    plans: () => request<any[]>("/api/payments/plans"),
    createOrder: (plan: string) =>
      request<any>("/api/payments/order", {
        method: "POST",
        body: JSON.stringify({ plan }),
      }),
    verify: (order_id: string, payment_id: string, signature: string) =>
      request<any>("/api/payments/verify", {
        method: "POST",
        body: JSON.stringify({ order_id, payment_id, signature }),
      }),
    simulate: (order_id: string) =>
      request<any>("/api/payments/simulate", {
        method: "POST",
        body: JSON.stringify({ order_id }),
      }),
    history: () => request<any[]>("/api/payments/history"),
  },
};
