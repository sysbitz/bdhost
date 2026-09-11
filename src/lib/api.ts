// In dev, "/api" is forwarded to localhost:4000 by the Vite proxy (vite.config.ts).
// In production, set VITE_API_URL to the deployed backend's /api URL.
const BASE =
	(import.meta as ImportMeta & { env?: { VITE_API_URL?: string } }).env
		?.VITE_API_URL ?? "https://bdhost-backend.onrender.com/api";

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
	plan: string;
	appLimit: number;
	storageLimitMb: number;
	emailVerified: boolean;
	emailVerifiedAt: string | null;
	planRenewsAt: string | null;
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

export const api = {
	register: (data: { fullName: string; email: string; password: string }) =>
		request<User>("/auth/register", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	login: (data: { email: string; password: string }) =>
		request<User>("/auth/login", {
			method: "POST",
			body: JSON.stringify(data),
		}),
	logout: () => request<{ ok: true }>("/auth/logout", { method: "POST" }),
	me: () => request<User>("/auth/me"),

	overview: () => request<Overview>("/overview"),
	billing: () => request<Billing>("/billing"),
	account: () => request<User>("/account"),

	listApps: () => request<App[]>("/apps"),
	getApp: (id: number) => request<App & { fileCount: number }>(`/apps/${id}`),
	createApp: (name: string) =>
		request<App>("/apps", { method: "POST", body: JSON.stringify({ name }) }),
	setLandingFile: (id: number, landingFile: string) =>
		request<App>(`/apps/${id}/landing`, {
			method: "PATCH",
			body: JSON.stringify({ landingFile }),
		}),
	restartApp: (id: number) =>
		request<App>(`/apps/${id}/restart`, { method: "POST" }),
	deleteApp: (id: number) =>
		request<{ ok: true }>(`/apps/${id}`, { method: "DELETE" }),

	listFiles: (appId: number, path = "") =>
		request<{ path: string; files: FileEntry[]; landingFile: string }>(
			`/apps/${appId}/files?path=${encodeURIComponent(path)}`,
		),
	uploadFiles: async (appId: number, files: FileList, path = "") => {
		const form = new FormData();
		Array.from(files).forEach((f) => form.append("files", f));
		const res = await fetch(
			`${BASE}/apps/${appId}/files/upload?path=${encodeURIComponent(path)}`,
			{ method: "POST", credentials: "include", body: form },
		);
		if (!res.ok) {
			const body = await res.json().catch(() => ({ error: res.statusText }));
			throw new Error(body.error ?? "Upload failed");
		}
		return res.json();
	},
	deleteFile: (appId: number, path: string) =>
		request<{ ok: true }>(
			`/apps/${appId}/files?path=${encodeURIComponent(path)}`,
			{
				method: "DELETE",
			},
		),
};
