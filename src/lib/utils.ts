import { DSCertificateListData, SessionListData } from "./types";
import { UAParser } from "ua-parser-js";
export type Option<T = string | number> = {
  label: string;
  value: T;
};

function get(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (typeof acc === "object" && acc !== null) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function mapToOptions<T, V = unknown>(
  items: T[],
  config: {
    label: string | ((item: T) => string);
    value: string | ((item: T) => V);
    fallbackLabel?: string;
    fallbackValue?: V;
  },
): Option<V>[] {
  const {
    label,
    value,
    fallbackLabel = "",
    fallbackValue = null as V,
  } = config;

  return items.map((item) => {
    const resolvedLabel =
      typeof label === "function" ? label(item) : get(item, label);

    const resolvedValue =
      typeof value === "function" ? value(item) : get(item, value);

    return {
      label: String(resolvedLabel ?? fallbackLabel),
      value: (resolvedValue ?? fallbackValue) as V,
    };
  });
}

export const isExpired = (validTo: string) => new Date(validTo) < new Date();

export const formatDate = (date: string) =>
  new Date(date).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export const maskSerial = (serial: string) =>
  serial.slice(0, 6) + "..." + serial.slice(-6);

const STATUS_STYLES = {
  active: "bg-green-100 text-green-700 dark:bg-green-500 dark:text-white",
  inactive: "bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-200",
  expired: "bg-red-100 text-red-700 dark:bg-red-500 dark:text-white",
  valid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500 dark:text-white",
} as const;
export const getStatus = (item: { is_active: boolean }) => ({
  label: item.is_active ? "Active" : "Inactive",
  color: item.is_active ? STATUS_STYLES.active : STATUS_STYLES.inactive,
});

export const getExpiryStatus = (item: DSCertificateListData) => {
  const expired = isExpired(item.valid_to);
  return {
    label: expired ? "Expired" : "Valid",
    color: expired ? STATUS_STYLES.expired : STATUS_STYLES.valid,
  };
};

export const getExpired = (item: SessionListData) => {
  const expired = isExpired(item.expires_at);
  return {
    label: expired ? "Expired" : "Active",
    color: expired ? STATUS_STYLES.expired : STATUS_STYLES.valid,
  };
};

export const parseDevice = (userAgent?: string) => {
  const parser = new UAParser(userAgent);

  const result = parser.getResult();

  return {
    browser: result.browser.name,
    browserVersion: result.browser.version,
    os: result.os.name,
    osVersion: result.os.version,
    deviceType: result.device.type || "desktop",
    deviceModel: result.device.model || null,
    deviceVendor: result.device.vendor || null,
  };
};
export function deepClean<T>(input: T): T {
  if (Array.isArray(input)) {
    return input
      .map((item) => deepClean(item))
      .filter((item) => item != null) as unknown as T;
  }

  if (input !== null && typeof input === "object") {
    const cleaned = Object.entries(input)
      .map(([key, value]) => [key, deepClean(value)])
      .filter(([, value]) => {
        if (value == null) return false;


        if (typeof value === "object" && !Array.isArray(value)) {
          return Object.keys(value).length > 0;
        }

        return true;
      });

    return Object.fromEntries(cleaned) as T;
  }

  return input;
}

export const getLabel = (

  item?: any | null,
  lang?: string | null,
): string => {
  if (!item) return "";
  const h =
    item.tehsil_name ||
    item.district_name ||
    item.state_name ||
    item.mandal_name ||
    item.name;
  const e =
    item.tehsil_name_en ||
    item.district_name_en ||
    item.state_name_en ||
    item.mandal_name_en ||
    item.name_en;

  return lang === "hi"
    ? String(h ?? e ?? "")
    : String(e ?? h ?? "");
};

export type Condition<T, R> = {
  when: (data: T) => boolean;
  then: (data: T) => R;
};
export function resolve<T, R>(
  data: T,
  conditions: readonly Condition<T, R>[],
  fallback: (data: T) => R,
): R {
  for (const condition of conditions) {
    if (condition.when(data)) {
      return condition.then(data);
    }
  }
  return fallback(data);
}

export function getFileUrl(fileUrl?: string | null): string {
  if (!fileUrl) return "";

  if (fileUrl.startsWith("http://") || fileUrl.startsWith("https://")) {
    try {
      const parsed = new URL(fileUrl);
      if (
        !parsed.pathname.startsWith("/api/") &&
        !parsed.pathname.startsWith("/api")
      ) {
        parsed.pathname = `/api${parsed.pathname}`;
      }
      return parsed.toString();
    } catch {
      return fileUrl;
    }
  }

  const cleanPath = fileUrl.startsWith("/") ? fileUrl : `/${fileUrl}`;
  const pathWithApi =
    cleanPath.startsWith("/api/") || cleanPath.startsWith("/api")
      ? cleanPath
      : `/api${cleanPath}`;

  const apiBase = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  ).replace(/\/+$/, "");
  const hostBase = apiBase.replace(/\/api$/, "");

  return `${hostBase}${pathWithApi}`;
}
