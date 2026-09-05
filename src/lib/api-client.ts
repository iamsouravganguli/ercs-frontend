import axios from "axios";

const LOGIN_URL = "/identity/signin";


function resolveBaseURL(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL || "";
  if (typeof window === "undefined" || window.location.protocol !== "http:") {
    return envUrl;
  }
  const { hostname } = window.location;


  const isLocalhost =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1";
  if (isLocalhost) return envUrl;


  if (window.location.protocol === "http:") {
    return `http:
  }
  return envUrl;
}

export const apiClient = axios.create({
  baseURL: resolveBaseURL(),
  withCredentials: true,
});


export const publicClient = axios.create({
  baseURL: resolveBaseURL(),
  withCredentials: false,
});


function attachDynamicBaseURL(client: typeof apiClient) {
  client.interceptors.request.use((config) => {
    const fresh = resolveBaseURL();
    if (fresh) config.baseURL = fresh;
    return config;
  });
}
attachDynamicBaseURL(apiClient);
attachDynamicBaseURL(publicClient);


let isRedirecting = false;

function isLogoutRequest(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes("/auth/logout/") || url.includes("/sessions/logout");
}

function clearStaleSessionLocally() {
  try { localStorage.removeItem("rccms_session"); } catch {}


  if (typeof document !== "undefined") {
    for (const n of ["access_token", "refresh_token", "sessionid", "csrftoken"]) {
      try { document.cookie = `${n}=; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/`; } catch {}
    }
  }
}


apiClient.interceptors.request.use((config) => {
  return config;
});


apiClient.interceptors.response.use(
  (res) => res,

  async (error) => {
    const data = error?.response?.data;
    const status = error?.response?.status;
    const originalRequest = error.config;


    const reqUrl: string = (originalRequest?.url as string) || "";
    const isSessionCheck = reqUrl.includes("/auth/session-check");
    if ((status === 401 || status === 403) && isSessionCheck) {
      clearStaleSessionLocally();


    }


    const msg: string = data?.message || error?.message || "";
    const isRedisError =
      msg.includes("6379") ||
      msg.includes("Connection refused") ||
      msg.includes("Redis");
    if (data?.success === false && status !== 401 && status !== 403 && !isRedisError) {
      console.error(data?.message);
    } else if (isRedisError) {
      console.warn(
        "[API] Transient backend issue — service temporarily unavailable",
      );
    } else if (!error?.response && isRedisError) {
      console.warn("[API] Network temporarily unavailable");
    }


    const isAuthFailure = status === 401 || status === 403;
    const shouldRetry = status === 401 && !originalRequest._retry && !isSessionCheck && !isLogoutRequest(reqUrl);
    if (shouldRetry) {
      originalRequest._retry = true;

      try {
        return apiClient(originalRequest);
      } catch {

      }
    }


    const isPublicPage =
      window.location.pathname === "/" ||
      window.location.pathname.startsWith("/upload") ||
      window.location.pathname.startsWith("/search") ||
      window.location.pathname.startsWith("/identity/signin") ||
      window.location.pathname.startsWith("/identity/signup") ||
      window.location.pathname.startsWith("/identity/reset-password") ||
      window.location.pathname.startsWith("/terms-and-conditions") ||
      window.location.pathname.startsWith("/privacy-policy") ||
      window.location.pathname.startsWith("/citizen-corner") ||
      window.location.pathname.startsWith("/knowledge-base");


    if (
      typeof window !== "undefined" &&
      isAuthFailure &&
      !isRedirecting &&
      !isPublicPage
    ) {

      const authMsg = (data?.message || "").toLowerCase();
      const isPermissionDenied = authMsg.includes("permission denied");
      if (status === 403 && isPermissionDenied) {

      } else {
        isRedirecting = true;
        const next = encodeURIComponent(
          window.location.pathname + window.location.search,
        );
        window.location.href = `${LOGIN_URL}?next=${next}`;
      }
    }

    return Promise.reject(error);
  },
);
