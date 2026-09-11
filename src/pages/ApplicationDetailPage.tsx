import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ArrowLeft, RefreshCw, Trash2, Check, Copy, Upload, Shield } from "lucide-react";
import { api } from "@/lib/api";

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const appId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: app } = useQuery({
    queryKey: ["app", appId],
    queryFn: () => api.getApp(appId),
    enabled: !!appId,
  });
  const { data: fileData } = useQuery({
    queryKey: ["files", appId, ""],
    queryFn: () => api.listFiles(appId, ""),
    enabled: !!appId,
  });

  async function handleRestart() {
    await api.restartApp(appId);
    queryClient.invalidateQueries({ queryKey: ["app", appId] });
  }

  async function handleDelete() {
    if (!confirm(`Delete "${app?.name}"? This cannot be undone.`)) return;
    await api.deleteApp(appId);
    queryClient.invalidateQueries({ queryKey: ["apps"] });
    queryClient.invalidateQueries({ queryKey: ["overview"] });
    navigate("/applications");
  }

  async function handleCopy() {
    if (!app) return;
    await navigator.clipboard.writeText(app.url.replace("https://", ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function handleUploadClick() {
    fileInputRef.current?.click();
  }

  async function handleFilesSelected(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    await api.uploadFiles(appId, e.target.files, "");
    queryClient.invalidateQueries({ queryKey: ["files", appId, ""] });
    queryClient.invalidateQueries({ queryKey: ["app", appId] });
    e.target.value = "";
  }

  async function handleLandingChange(e: React.ChangeEvent<HTMLSelectElement>) {
    await api.setLandingFile(appId, e.target.value);
    queryClient.invalidateQueries({ queryKey: ["app", appId] });
    queryClient.invalidateQueries({ queryKey: ["files", appId, ""] });
  }

  if (!app) return null;

  const htmlFiles = (fileData?.files ?? []).filter(
    (f) => f.type === "file" && f.file.endsWith(".html")
  );

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to="/applications"
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Applications
      </Link>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
            Application
          </p>
          <h1 className="text-3xl font-bold tracking-tight">{app.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{app.url.replace("https://", "")}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleRestart}
            className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Restart
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center justify-center rounded-lg border border-border p-2 text-destructive hover:bg-destructive/10"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Application overview</h2>
                <p className="text-sm text-muted-foreground">
                  Your app is ready for files and a landing page.
                </p>
              </div>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600">
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                {app.status === "running" ? "Running" : "Stopped"}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-4 border-t border-border pt-4">
              <div>
                <p className="text-xs text-muted-foreground">Runtime</p>
                <p className="text-sm font-semibold">{app.runtime}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Storage used</p>
                <p className="text-sm font-semibold">—</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Files</p>
                <p className="text-sm font-semibold">{app.fileCount} uploaded</p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">Landing page</h2>
                <p className="text-sm text-muted-foreground">
                  Choose the HTML file that opens when someone visits your app link.
                </p>
              </div>
            </div>
            <select
              value={app.landingFile}
              onChange={handleLandingChange}
              className="mb-2 w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              <option value={app.landingFile}>{app.landingFile}</option>
              {htmlFiles
                .filter((f) => f.file !== app.landingFile)
                .map((f) => (
                  <option key={f.file} value={f.file}>
                    {f.file}
                  </option>
                ))}
            </select>
            <p className="mb-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
              <Check className="h-3.5 w-3.5" /> {app.landingFile} is linked to your app URL
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={handleFilesSelected}
            />
            <button
              onClick={handleUploadClick}
              className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <Upload className="h-3.5 w-3.5" /> Upload files
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-3 font-semibold">Your app link</h2>
            <div className="flex items-center justify-between rounded-lg bg-emerald-500/10 px-3 py-2.5">
              <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                <Check className="h-3.5 w-3.5" /> {app.url.replace("https://", "")}
              </span>
              <button onClick={handleCopy} className="text-emerald-700">
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            {copied && <p className="mt-1.5 text-xs text-muted-foreground">Copied!</p>}
            <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Shield className="h-3.5 w-3.5" /> Secure link included with your app
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h2 className="mb-1 font-semibold">Next step</h2>
            <p className="mb-3 text-sm text-muted-foreground">
              Upload your site files, then link an HTML file as the landing page.
            </p>
            <button
              onClick={handleUploadClick}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              <Upload className="h-3.5 w-3.5" /> Upload files
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
