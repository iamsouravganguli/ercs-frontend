

export const redirectUtil = {

  get: (searchParams: URLSearchParams, fallback: string = "/"): string => {
    const redirect = searchParams.get("next");

    if (!redirect) return fallback;

    try {
      const decoded = decodeURIComponent(redirect);


      return decoded.startsWith("/") ? decoded : fallback;
    } catch {
      return fallback;
    }
  },

  set: (path: string, loginPath: string = "/signin"): string => {
    return `${loginPath}?next=${encodeURIComponent(path)}`;
  },
};
