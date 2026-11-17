import axios, { type AxiosResponse, type InternalAxiosRequestConfig } from "axios";

type RetryConfig = InternalAxiosRequestConfig & { sessionRetried?: boolean };
const transport = { baseURL: "/api", timeout: 35_000, withCredentials: true, headers: { Accept: "application/json" } };
export const api = axios.create(transport);
const refreshTransport = axios.create(transport);
let refreshInFlight: Promise<void> | null = null;

function refreshSession() {
  if (!refreshInFlight) {
    refreshInFlight = refreshTransport.post("/auth/refresh").then(() => undefined).catch(async error => {
      // Another tab may have rotated the cookie already. Do not rotate again.
      if (axios.isAxiosError(error) && error.response?.status === 409) {
        await refreshTransport.get("/auth/me");
        return;
      }
      if (axios.isAxiosError(error) && [401, 403].includes(error.response?.status ?? 0)) {
        if (typeof window !== "undefined") window.dispatchEvent(new Event("auth:expired"));
      }
      throw error;
    }).finally(() => { refreshInFlight = null; });
  }
  return refreshInFlight;
}

async function retrySession(response: AxiosResponse) {
  const config = response.config as RetryConfig;
  // Password and login failures must reach the form instead of refreshing.
  const eligible = config.url === "/auth/me" || config.url?.startsWith("/ocr") ||
    (config.url?.startsWith("/account/") && !["/account/me/password", "/account/me/email/change"].includes(config.url)) ||
    config.url?.startsWith("/roles") || config.url?.startsWith("/users") || config.url?.startsWith("/admin/") || config.url?.startsWith("/categories") || config.url?.startsWith("/scans") || config.url?.startsWith("/reports");
  if (response.status !== 401 || config.sessionRetried || !eligible) return response;
  config.sessionRetried = true;
  await refreshSession();
  return api.request(config);
}

// The OCR adapter accepts all HTTP statuses; cover both Axios response paths.
api.interceptors.response.use(retrySession, async error => {
  if (!axios.isAxiosError(error) || !error.response) throw error;
  const response = await retrySession(error.response);
  if (response === error.response) throw error;
  return response;
});

export function apiErrorMessage(error: unknown, fallback: string) {
  if (!axios.isAxiosError(error)) return error instanceof Error ? error.message : fallback;
  const message = error.response?.data?.message;
  if (typeof message === "string" && message.trim()) return message;
  if (error.code === "ECONNABORTED") return "The request took too long. Please try again.";
  return ({ 400: "Check your details and try again.", 401: "Please sign in again.", 403: "You do not have permission to do this.",
    429: "Too many requests. Please try again later.", 502: "The service could not process this request.",
    503: "The service is temporarily unavailable.", 504: "Processing took too long. Please try again." } as Record<number, string>)[error.response?.status ?? 0] ?? fallback;
}
