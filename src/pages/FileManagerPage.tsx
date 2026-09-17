import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
	Folder,
	FileText,
	FileCode,
	Upload,
	Trash2,
	FolderPlus,
} from "lucide-react";
import { api } from "@/lib/api";

export default function FileManagerPage() {
	const [appId, setAppId] = useState<string | null>(null);
	const [path, setPath] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);
	const queryClient = useQueryClient();

	const { data: apps } = useQuery({
		queryKey: ["apps"],
		queryFn: api.listApps,
	});
	const { data: overview } = useQuery({
		queryKey: ["overview"],
		queryFn: api.overview,
	});

	const activeAppId = appId ?? apps?.[0]?.id ?? null;
	const activeApp = apps?.find((a) => a.id === activeAppId);

	const { data: fileData } = useQuery({
		queryKey: ["files", activeAppId, path],
		queryFn: () => api.listFiles(activeAppId!, path),
		enabled: !!activeAppId,
	});

	async function handleUploadClick() {
		fileInputRef.current?.click();
	}

	async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
		if (!activeAppId || !e.target.files || e.target.files.length === 0) return;
		await api.uploadFiles(activeAppId, e.target.files, path);
		queryClient.invalidateQueries({ queryKey: ["files", activeAppId, path] });
		queryClient.invalidateQueries({ queryKey: ["overview"] });
		e.target.value = "";
	}

	async function handleDelete(relPath: string) {
		if (!activeAppId) return;
		if (!confirm(`Delete "${relPath}"?`)) return;
		await api.deleteFile(activeAppId, relPath);
		queryClient.invalidateQueries({ queryKey: ["files", activeAppId, path] });
		queryClient.invalidateQueries({ queryKey: ["overview"] });
	}

	const usedMb = overview?.storage.usedMb ?? 0;
	const limitMb = overview?.storage.limitMb ?? 100;
	const pct = Math.min(100, Math.round((usedMb / Math.max(limitMb, 1)) * 100));

	return (
		<div className="mx-auto max-w-5xl">
			<p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
				{activeApp?.name ?? "File manager"}
			</p>
			<div className="mb-6 flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold tracking-tight">File manager</h1>
					<p className="mt-1 text-sm text-muted-foreground">
						Upload the files for{" "}
						{activeApp?.url.replace("https://", "") ?? "your app"}, then link an
						HTML file as its landing page.
					</p>
				</div>
				<div className="flex items-center gap-2">
					<select
						value={activeAppId ?? ""}
						onChange={(e) => {
							setAppId(e.target.value);
							setPath("");
						}}
						className="rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none">
						{apps?.map((a) => (
							<option key={a.id} value={a.id}>
								{a.name}
							</option>
						))}
					</select>
					<input
						ref={fileInputRef}
						type="file"
						multiple
						className="hidden"
						onChange={handleFilesSelected}
					/>
					<button
						onClick={handleUploadClick}
						className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
						<Upload className="h-4 w-4" /> Upload files
					</button>
				</div>
			</div>

			<div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-card px-5 py-4">
				<div className="flex items-center gap-3">
					<Folder className="h-4 w-4 text-muted-foreground" />
					<span className="text-sm">
						<span className="font-semibold">{usedMb} MB</span>{" "}
						<span className="text-muted-foreground">
							of {limitMb} MB shared
						</span>
					</span>
					<div className="h-1.5 w-40 overflow-hidden rounded-full bg-muted">
						<div className="h-full bg-primary" style={{ width: `${pct}%` }} />
					</div>
				</div>
				<div className="flex items-center gap-3">
					<span className="text-sm text-muted-foreground">
						{Math.max(limitMb - usedMb, 0)} MB remaining
					</span>
					<button className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted">
						<FolderPlus className="h-3.5 w-3.5" /> New folder
					</button>
				</div>
			</div>

			{path && (
				<button
					onClick={() => setPath(path.split("/").slice(0, -1).join("/"))}
					className="mb-2 text-sm text-primary hover:underline">
					← Back
				</button>
			)}

			<div className="rounded-xl border border-border bg-card">
				<div className="grid grid-cols-[1fr_100px_140px_40px] gap-4 border-b border-border px-5 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
					<span>Name</span>
					<span>Size</span>
					<span>Modified</span>
					<span />
				</div>
				<div className="divide-y divide-border">
					{fileData?.files.map((f) => (
						<div
							key={f.fullpath}
							className="grid grid-cols-[1fr_100px_140px_40px] items-center gap-4 px-5 py-3">
							<button
								onClick={() =>
									f.type === "dir" &&
									setPath(path ? `${path}/${f.file}` : f.file)
								}
								className="flex items-center gap-2 text-left text-sm font-medium">
								{f.type === "dir" ? (
									<Folder className="h-4 w-4 text-primary" />
								) : f.file.endsWith(".html") ? (
									<FileCode className="h-4 w-4 text-blue-500" />
								) : (
									<FileText className="h-4 w-4 text-muted-foreground" />
								)}
								{f.file}
								{f.file === fileData.landingFile && (
									<span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
										✓ Landing page
									</span>
								)}
							</button>
							<span className="text-sm text-muted-foreground">
								{f.type === "dir" ? "—" : formatSize(f.size)}
							</span>
							<span className="text-sm text-muted-foreground">
								{new Date(f.mtime * 1000).toLocaleDateString(undefined, {
									month: "short",
									day: "numeric",
									year: "numeric",
								})}
							</span>
							<button
								onClick={() =>
									handleDelete(path ? `${path}/${f.file}` : f.file)
								}
								className="text-muted-foreground hover:text-destructive">
								<Trash2 className="h-4 w-4" />
							</button>
						</div>
					))}
					{fileData && fileData.files.length === 0 && (
						<div className="py-12 text-center text-sm text-muted-foreground">
							No files yet — upload your first file to get started.
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function formatSize(bytes: number): string {
	if (bytes < 1024) return `${bytes} B`;
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
