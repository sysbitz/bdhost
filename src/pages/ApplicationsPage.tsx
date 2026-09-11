import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Plus, Code2, ExternalLink } from "lucide-react";
import { api } from "@/lib/api";

export default function ApplicationsPage() {
  const [params, setParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(params.get("new") === "1");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const queryClient = useQueryClient();

  const { data: apps } = useQuery({ queryKey: ["apps"], queryFn: api.listApps });

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!name.trim()) return;
    setCreating(true);
    try {
      await api.createApp(name.trim());
      setName("");
      setShowCreate(false);
      params.delete("new");
      setParams(params);
      queryClient.invalidateQueries({ queryKey: ["apps"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create app");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Applications</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage every app hosted in this workspace.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New application
        </button>
      </div>

      {showCreate && (
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-xl border border-border bg-card p-5"
        >
          <label className="mb-1.5 block text-sm font-medium">App name</label>
          <div className="flex gap-2">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Health App"
              className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => setShowCreate(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium"
            >
              Cancel
            </button>
          </div>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
        </form>
      )}

      <div className="rounded-xl border border-border bg-card">
        {apps?.length ? (
          <div className="divide-y divide-border">
            {apps.map((app) => (
              <Link
                key={app.id}
                to={`/applications/${app.id}`}
                className="flex items-center justify-between px-5 py-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <Code2 className="h-4.5 w-4.5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{app.name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      {app.url.replace("https://", "")}
                      <ExternalLink className="h-3 w-3" />
                    </p>
                  </div>
                </div>
                <span
                  className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                    app.status === "running"
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {app.status === "running" ? "Running" : "Stopped"}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium">No applications yet</p>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">
              Create your first app to get a live link.
            </p>
            <button
              onClick={() => setShowCreate(true)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Create app
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
