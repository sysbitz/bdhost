const BASE = "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers ?? {}) },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(body.error ?? `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export type User = {
  id: number;
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
  id: number;
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
    id: number;
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
  id: number;
  device: string;
  browser: string;
  location: string;
  ipAddress: string;
  lastActiveAt: string;
  current: boolean;
};

export const api = {
  register: (data: { fullName: string; email: string; password: string }) =>
    request<User>("/auth/register", { method: "POST", body: JSON.stringify(data) }),
  login: (data: { email: string; password: string; remember?: boolean }) =>
    request<User>("/auth/login", { method: "POST", body: JSON.stringify(data) }),
  logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),
  logoutAllSessions: () => request<{ ok: true }>("/auth/logout-all", { method: "POST" }),
  me: () => request<User>("/auth/me"),

  forgotPassword: (email: string) =>
    request<{ ok: true }>("/auth/forgot-password", { method: "POST", body: JSON.stringify({ email }) }),
  resetPassword: (data: { token: string; password: string }) =>
    request<{ ok: true }>("/auth/reset-password", { method: "POST", body: JSON.stringify(data) }),

  verifyEmail: (token: string) =>
    request<{ ok: true }>("/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) }),
  resendVerification: () =>
    request<{ ok: true }>("/auth/resend-verification", { method: "POST" }),

  overview: () => request<Overview>("/overview"),
  billing: () => request<Billing>("/billing"),
  account: () => request<User>("/account"),
  updateProfile: (data: { fullName: string }) =>
    request<User>("/account/profile", { method: "PATCH", body: JSON.stringify(data) }),
  uploadAvatar: async (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    const res = await fetch(`${BASE}/account/avatar`, {
      method: "POST",
      credentials: "include",
      body: form,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error ?? "Upload failed");
    }
    return res.json() as Promise<User>;
  },
  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    request<{ ok: true }>("/account/password", { method: "PATCH", body: JSON.stringify(data) }),
  requestEmailChange: (newEmail: string) =>
    request<User>("/account/email", { method: "POST", body: JSON.stringify({ newEmail }) }),
  cancelEmailChange: () =>
    request<User>("/account/email", { method: "DELETE" }),
  updateNotificationPrefs: (prefs: User["notificationPrefs"]) =>
    request<User>("/account/notifications", { method: "PATCH", body: JSON.stringify(prefs) }),
  deleteAccount: (password: string) =>
    request<{ ok: true }>("/account", { method: "DELETE", body: JSON.stringify({ password }) }),

  listSessions: () => request<Session[]>("/account/sessions"),
  revokeSession: (id: number) =>
    request<{ ok: true }>(`/account/sessions/${id}`, { method: "DELETE" }),

  enableTwoFactor: () => request<User>("/account/2fa/enable", { method: "POST" }),
  disableTwoFactor: () => request<User>("/account/2fa/disable", { method: "POST" }),

  listApps: () => request<App[]>("/apps"),
  getApp: (id: number) => request<App & { fileCount: number }>(`/apps/${id}`),
  createApp: (name: string) =>
    request<App>("/apps", { method: "POST", body: JSON.stringify({ name }) }),
  setLandingFile: (id: number, landingFile: string) =>
    request<App>(`/apps/${id}/landing`, {
      method: "PATCH",
      body: JSON.stringify({ landingFile }),
    }),
  restartApp: (id: number) => request<App>(`/apps/${id}/restart`, { method: "POST" }),
  deleteApp: (id: number) => request<{ ok: true }>(`/apps/${id}`, { method: "DELETE" }),

  listFiles: (appId: number, path = "") =>
    request<{ path: string; files: FileEntry[]; landingFile: string }>(
      `/apps/${appId}/files?path=${encodeURIComponent(path)}`
    ),
  uploadFiles: async (appId: number, files: FileList, path = "") => {
    const form = new FormData();
    Array.from(files).forEach((f) => form.append("files", f));
    const res = await fetch(
      `${BASE}/apps/${appId}/files/upload?path=${encodeURIComponent(path)}`,
      { method: "POST", credentials: "include", body: form }
    );
    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(body.error ?? "Upload failed");
    }
    return res.json();
  },
  deleteFile: (appId: number, path: string) =>
    request<{ ok: true }>(`/apps/${appId}/files?path=${encodeURIComponent(path)}`, {
      method: "DELETE",
    }),
};
