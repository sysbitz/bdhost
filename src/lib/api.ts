const BASE = "/api";

/* ------------------------------------------------------------------ */
/* Token storage + transport                                          */
/*                                                                      */
/* The backend issues a short-lived bearer access token from           */
/* POST /auth/login (kept in memory only — never localStorage) plus an  */
/* httpOnly refresh cookie scoped to /auth. On a fresh page load there  */
/* is no access token in memory yet, so the first authenticated call    */
/* transparently mints one via POST /auth/refresh using that cookie.    */
/* ------------------------------------------------------------------ */

let accessToken: string | null = null;
let refreshPromise: Promise<string | null> | null = null;

function setAccessToken(token: string | null) {
  accessToken = token;
}

async function refreshAccessToken(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = (async () => {
    try {
      const res = await fetch(`${BASE}/auth/refresh`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        accessToken = null;
        return null;
      }
      const data = (await res.json()) as { access_token: string };
      accessToken = data.access_token;
      return accessToken;
    } catch {
      accessToken = null;
      return null;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

function authHeaders(extra?: HeadersInit): HeadersInit {
  return {
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...(extra ?? {}),
  };
}

async function extractError(res: Response): Promise<string> {
  const body = await res.json().catch(() => ({}) as Record<string, unknown>);
  const detail = (body as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail) && detail[0]?.msg) return String(detail[0].msg);
  return res.statusText || `Request failed: ${res.status}`;
}

const NO_RETRY_PATHS = new Set(["/auth/login", "/auth/refresh", "/auth/register"]);

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!accessToken && !NO_RETRY_PATHS.has(path)) {
    await refreshAccessToken();
  }

  const doFetch = () =>
    fetch(`${BASE}${path}`, {
      credentials: "include",
      ...options,
      headers: authHeaders({
        "Content-Type": "application/json",
        ...(options.headers ?? {}),
      }),
    });

  let res = await doFetch();

  if (res.status === 401 && !NO_RETRY_PATHS.has(path)) {
    const newToken = await refreshAccessToken();
    if (newToken) res = await doFetch();
  }

  if (!res.ok) throw new Error(await extractError(res));
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

async function requestForm<T>(path: string, form: FormData, method = "POST"): Promise<T> {
  if (!accessToken) await refreshAccessToken();

  const doFetch = () =>
    fetch(`${BASE}${path}`, {
      method,
      credentials: "include",
      headers: authHeaders(),
      body: form,
    });

  let res = await doFetch();
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) res = await doFetch();
  }

  if (!res.ok) throw new Error(await extractError(res));
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

/* ------------------------------------------------------------------ */
/* Frontend-facing types (unchanged shape from the original UI design) */
/* ------------------------------------------------------------------ */

export type User = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl?: string | null;
  plan: string;
  appLimit: number;
  storageLimitMb: number;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  planRenewsAt: string | null;
  pendingEmail?: string | null;
  twoFactorEnabled?: boolean;
  notificationPrefs?: {
    productUpdates: boolean;
    securityAlerts: boolean;
    appStatusAlerts: boolean;
    billingReminders: boolean;
  };
};

export type App = {
  id: string;
  name: string;
  slug: string;
  url: string;
  landingFile: string;
  status: string;
  runtime: string;
  createdAt: string;
  fileCount?: number;
};

export type Overview = {
  fullName: string;
  apps: { used: number; limit: number };
  storage: { usedMb: number; limitMb: number };
  recentApps: App[];
};

export type Billing = {
  plan: string;
  appLimit: number;
  storageLimitMb: number;
  appsUsed: number;
  storageUsedMb: number;
  renewsAt: string | null;
  paymentHistory: {
    id: string;
    planLabel: string;
    amount: number;
    status: string;
    paidAt: string;
  }[];
};

export type FileEntry = {
  file: string;
  fullpath: string;
  size: number;
  mtime: number;
  type: "file" | "dir";
};

export type Session = {
  id: string;
  device: string;
  browser: string;
  location: string;
  ipAddress: string;
  lastActiveAt: string;
  current: boolean;
};

/* ------------------------------------------------------------------ */
/* Raw backend response shapes (snake_case, as FastAPI returns them)  */
/* ------------------------------------------------------------------ */

type RawPlan = {
  id: string;
  name: string;
  app_limit: number;
  storage_limit_mb: number;
  price: string | number;
  features: Record<string, unknown>;
};

type RawSubscription = { plan: RawPlan; renews_at: string | null };

type RawNotificationPrefs = {
  productUpdates: boolean;
  securityAlerts: boolean;
  appStatusAlerts: boolean;
  billingReminders: boolean;
};

type RawUser = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  created_at: string;
  email_verified: boolean;
  email_verified_at: string | null;
  pending_email: string | null;
  avatar_url: string | null;
  two_factor_enabled: boolean;
  notification_prefs: RawNotificationPrefs;
};

type RawAccountStats = { user: RawUser; total_apps: number; total_storage_bytes: number };

type RawApp = {
  id: string;
  subdomain: string;
  status: string;
  plan_id: string;
  storage_bytes_used: number;
  custom_index: string;
  spa_fallback: boolean;
  created_at: string;
  updated_at: string;
  live_url: string;
  plan_name: string;
};

type RawFileItem = { key: string; size: number; last_modified: string | null; etag: string };
type RawFileList = { app_id: string; storage_bytes_used: number; files: RawFileItem[] };

type RawSession = {
  id: string;
  device: string;
  browser: string;
  ip_address: string;
  last_active_at: string;
  created_at: string;
  current: boolean;
};

type RawPayment = {
  id: string;
  plan_id: string;
  plan_name: string;
  amount: string | number;
  status: string;
  created_at: string;
};

type RawTwoFactorEnableResponse = { user: RawUser; secret: string; otpauth_url: string };

/* ------------------------------------------------------------------ */
/* Mappers: backend shape -> frontend shape                           */
/* ------------------------------------------------------------------ */

function mapStatus(status: string): string {
  // Static-site statuses (provisioning/active/suspended/deleting/deleted/failed)
  // collapse onto the UI's binary Running/Stopped badge.
  return status === "active" ? "running" : "stopped";
}

function mapApp(raw: RawApp): App {
  return {
    id: raw.id,
    name: raw.subdomain,
    slug: raw.subdomain,
    url: raw.live_url,
    landingFile: raw.custom_index,
    status: mapStatus(raw.status),
    runtime: raw.plan_name,
    createdAt: raw.created_at,
  };
}

function mapUser(user: RawUser, sub: RawSubscription): User {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    avatarUrl: user.avatar_url,
    plan: sub.plan.name,
    appLimit: sub.plan.app_limit,
    storageLimitMb: sub.plan.storage_limit_mb,
    emailVerified: user.email_verified,
    emailVerifiedAt: user.email_verified_at,
    planRenewsAt: sub.renews_at,
    pendingEmail: user.pending_email,
    twoFactorEnabled: user.two_factor_enabled,
    notificationPrefs: user.notification_prefs,
  };
}

async function fetchMergedUser(): Promise<User> {
  const [stats, sub] = await Promise.all([
    request<RawAccountStats>("/account"),
    request<RawSubscription>("/billing/subscription"),
  ]);
  return mapUser(stats.user, sub);
}

/** Generates a valid, likely-unique subdomain slug from a free-text app name,
 * since the backend needs a DNS-safe subdomain (3-63 chars, lowercase
 * alphanumeric with internal hyphens) rather than an arbitrary display name. */
function slugifyAppName(name: string): string {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "app";
  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

export const api = {
  register: async (data: { fullName: string; email: string; password: string }): Promise<User> => {
    await request<RawUser>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ email: data.email, password: data.password, full_name: data.fullName }),
    });
    // The backend doesn't auto-login on register, so sign the new account in
    // immediately with the same credentials to preserve the original one-step flow.
    return api.login({ email: data.email, password: data.password });
  },

  login: async (data: { email: string; password: string; remember?: boolean }): Promise<User> => {
    const tokenRes = await request<{ access_token: string; token_type: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email: data.email, password: data.password }),
    });
    setAccessToken(tokenRes.access_token);
    return fetchMergedUser();
  },

  logout: async () => {
    const res = await request<{ ok: boolean }>("/auth/logout", { method: "POST" });
    setAccessToken(null);
    return res;
  },
  logoutAllSessions: async () => {
    const res = await request<{ ok: boolean }>("/auth/logout-all", { method: "POST" });
    setAccessToken(null);
    return res;
  },
  me: (): Promise<User> => fetchMergedUser(),

  forgotPassword: (email: string) =>
    request<{ ok: boolean; message?: string }>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  resetPassword: (data: { token: string; password: string }) =>
    request<{ ok: boolean; message?: string }>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  verifyEmail: (token: string) =>
    request<RawUser>("/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) }),
  resendVerification: () =>
    request<{ ok: boolean; message?: string }>("/auth/resend-verification", { method: "POST" }),

  overview: async (): Promise<Overview> => {
    const [stats, sub, apps] = await Promise.all([
      request<RawAccountStats>("/account"),
      request<RawSubscription>("/billing/subscription"),
      request<RawApp[]>("/apps"),
    ]);
    return {
      fullName: stats.user.full_name,
      apps: { used: apps.length, limit: sub.plan.app_limit },
      storage: {
        usedMb: Math.round(stats.total_storage_bytes / (1024 * 1024)),
        limitMb: sub.plan.storage_limit_mb,
      },
      recentApps: apps.slice(0, 5).map(mapApp),
    };
  },

  billing: async (): Promise<Billing> => {
    const [sub, stats, payments] = await Promise.all([
      request<RawSubscription>("/billing/subscription"),
      request<RawAccountStats>("/account"),
      request<RawPayment[]>("/billing/payments"),
    ]);
    return {
      plan: sub.plan.name,
      appLimit: sub.plan.app_limit,
      storageLimitMb: sub.plan.storage_limit_mb,
      appsUsed: stats.total_apps,
      storageUsedMb: Math.round(stats.total_storage_bytes / (1024 * 1024)),
      renewsAt: sub.renews_at,
      paymentHistory: payments.map((p) => ({
        id: p.id,
        planLabel: p.plan_name,
        amount: Number(p.amount),
        status: p.status,
        paidAt: p.created_at,
      })),
    };
  },

  account: (): Promise<User> => fetchMergedUser(),
  updateProfile: async (data: { fullName: string }) => {
    await request<RawUser>("/account", { method: "PATCH", body: JSON.stringify({ full_name: data.fullName }) });
    return fetchMergedUser();
  },
  uploadAvatar: async (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    await requestForm<RawUser>("/account/avatar", form, "POST");
    return fetchMergedUser();
  },
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ ok: boolean; message?: string }>("/account/password", {
      method: "PATCH",
      body: JSON.stringify({ current_password: data.currentPassword, new_password: data.newPassword }),
    }),
  requestEmailChange: async (newEmail: string) => {
    await request<RawUser>("/account/email", { method: "POST", body: JSON.stringify({ new_email: newEmail }) });
    return fetchMergedUser();
  },
  cancelEmailChange: async () => {
    await request<RawUser>("/account/email", { method: "DELETE" });
    return fetchMergedUser();
  },
  updateNotificationPrefs: async (prefs: User["notificationPrefs"]) => {
    await request<RawUser>("/account/notifications", { method: "PATCH", body: JSON.stringify(prefs) });
    return fetchMergedUser();
  },
  deleteAccount: async (password: string) => {
    const res = await request<{ ok: boolean; message?: string }>("/account", {
      method: "DELETE",
      body: JSON.stringify({ password }),
    });
    setAccessToken(null);
    return res;
  },

  listSessions: async (): Promise<Session[]> => {
    const sessions = await request<RawSession[]>("/account/sessions");
    return sessions.map((s) => ({
      id: s.id,
      device: s.device,
      browser: s.browser,
      location: "Unknown location",
      ipAddress: s.ip_address,
      lastActiveAt: s.last_active_at,
      current: s.current,
    }));
  },
  revokeSession: (id: string) =>
    request<{ ok: boolean; message?: string }>(`/account/sessions/${id}`, { method: "DELETE" }),

  enableTwoFactor: async (): Promise<User> => {
    const res = await request<RawTwoFactorEnableResponse>("/account/2fa/enable", { method: "POST" });
    const sub = await request<RawSubscription>("/billing/subscription");
    return mapUser(res.user, sub);
  },
  disableTwoFactor: async (): Promise<User> => {
    await request<RawUser>("/account/2fa/disable", { method: "POST" });
    return fetchMergedUser();
  },

  listApps: async (): Promise<App[]> => {
    const apps = await request<RawApp[]>("/apps");
    return apps.map(mapApp);
  },
  getApp: async (id: string): Promise<App & { fileCount: number }> => {
    const [app, fileList] = await Promise.all([
      request<RawApp>(`/apps/${id}`),
      request<RawFileList>(`/apps/${id}/files`),
    ]);
    return { ...mapApp(app), fileCount: fileList.files.length };
  },
  createApp: async (name: string): Promise<App> => {
    const app = await request<RawApp>("/apps", {
      method: "POST",
      body: JSON.stringify({ subdomain: slugifyAppName(name) }),
    });
    return mapApp(app);
  },
  setLandingFile: async (id: string, landingFile: string): Promise<App> => {
    const app = await request<RawApp>(`/apps/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ custom_index: landingFile }),
    });
    return mapApp(app);
  },
  restartApp: async (id: string): Promise<App> => {
    const app = await request<RawApp>(`/apps/${id}/restart`, { method: "POST" });
    return mapApp(app);
  },
  deleteApp: (id: string) => request<void>(`/apps/${id}`, { method: "DELETE" }).then(() => ({ ok: true as const })),

  listFiles: async (
    appId: string,
    path = ""
  ): Promise<{ path: string; files: FileEntry[]; landingFile: string }> => {
    const [fileList, app] = await Promise.all([
      request<RawFileList>(`/apps/${appId}/files`),
      request<RawApp>(`/apps/${appId}`),
    ]);

    // The backend has no folder concept -- just flat storage keys. Group keys
    // client-side by "/" so browsing still feels like a directory tree.
    const prefix = path ? `${path}/` : "";
    const seenDirs = new Set<string>();
    const entries: FileEntry[] = [];

    for (const f of fileList.files) {
      if (!f.key.startsWith(prefix)) continue;
      const rest = f.key.slice(prefix.length);
      if (!rest) continue;
      const slashIdx = rest.indexOf("/");
      if (slashIdx === -1) {
        entries.push({
          file: rest,
          fullpath: f.key,
          size: f.size,
          mtime: f.last_modified ? Math.floor(new Date(f.last_modified).getTime() / 1000) : 0,
          type: "file",
        });
      } else {
        const dirName = rest.slice(0, slashIdx);
        if (!seenDirs.has(dirName)) {
          seenDirs.add(dirName);
          entries.push({ file: dirName, fullpath: prefix + dirName, size: 0, mtime: 0, type: "dir" });
        }
      }
    }

    entries.sort((a, b) =>
      a.type === b.type ? a.file.localeCompare(b.file) : a.type === "dir" ? -1 : 1
    );

    return { path, files: entries, landingFile: app.custom_index };
  },

  uploadFiles: async (appId: string, files: FileList, path = "") => {
    // The backend only accepts one file per request (no batch endpoint), so
    // upload sequentially and combine the destination folder + filename into
    // the single relative path it expects.
    for (const file of Array.from(files)) {
      const relPath = path ? `${path}/${file.name}` : file.name;
      const form = new FormData();
      form.append("file", file);
      form.append("path", relPath);
      await requestForm(`/apps/${appId}/files`, form, "POST");
    }
    return { ok: true as const };
  },
  deleteFile: (appId: string, path: string) =>
    request<void>(`/apps/${appId}/files?path=${encodeURIComponent(path)}`, { method: "DELETE" }).then(() => ({
      ok: true as const,
    })),
};