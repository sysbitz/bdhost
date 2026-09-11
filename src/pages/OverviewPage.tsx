import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Package, HardDrive, Plus, Code2, ExternalLink, RefreshCw, ArrowRight } from "lucide-react";
import { api } from "@/lib/api";

const setupSteps = [
  { n: "01", title: "Create app", desc: "Give your project a name." },
  { n: "02", title: "Upload files", desc: "Add your HTML, CSS, and assets." },
  { n: "03", title: "Link landing page", desc: "Choose the file your URL opens." },
];

export default function OverviewPage() {
  const { data } = useQuery({ queryKey: ["overview"], queryFn: api.overview });

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="mx-auto max-w-5xl">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
        {today}
      </p>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Good {greeting()}, {data?.fullName?.split(" ")[0] ?? ""}.
          </h1>
          <p className="mt-1 text-muted-foreground">
            Create an app, upload your files, and choose what visitors see.
          </p>
        </div>
        <Link
          to="/applications?new=1"
          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
        >
          <Plus className="h-4 w-4" /> New application
        </Link>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Package className="h-4.5 w-4.5 text-primary" />
            </div>
          </div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Applications
          </p>
          <p className="text-2xl font-bold">
            {data?.apps.used ?? 0} / {data?.apps.limit ?? "—"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {data ? Math.max(data.apps.limit - data.apps.used, 0) : 0} slot
            {data && data.apps.limit - data.apps.used === 1 ? "" : "s"} available
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="mb-6 flex items-start justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10">
              <HardDrive className="h-4.5 w-4.5 text-emerald-600" />
            </div>
          </div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Shared storage
          </p>
          <p className="text-2xl font-bold">
            {data?.storage.usedMb ?? 0} / {data?.storage.limitMb ?? "—"} MB
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {data ? Math.max(data.storage.limitMb - data.storage.usedMb, 0) : 0} MB remaining
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-semibold">Your applications</h2>
            <p className="text-sm text-muted-foreground">
              Upload files and connect a landing page from each app.
            </p>
          </div>
          <Link
            to="/applications"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View all <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {data?.recentApps.length ? (
          <div className="divide-y divide-border">
            {data.recentApps.map((app) => (
              <Link
                key={app.id}
                to={`/applications/${app.id}`}
                className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                    <Code2 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{app.name}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      {app.url.replace("https://", "")}
                      <ExternalLink className="h-3 w-3" />
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
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
                  <RefreshCw className="h-4 w-4 text-muted-foreground" />
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border py-10 text-center">
            <p className="text-sm font-medium">No applications yet</p>
            <p className="mb-4 mt-1 text-sm text-muted-foreground">
              Create your first app to get a live link.
            </p>
            <Link
              to="/applications?new=1"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Create app
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <h3 className="mb-4 flex items-center gap-2 font-semibold">
            🚀 Simple setup
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {setupSteps.map((s) => (
              <div key={s.n} className="rounded-lg bg-muted/60 p-3">
                <p className="mb-1 text-xs font-bold text-primary">{s.n}</p>
                <p className="text-sm font-semibold">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <p className="mb-2 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
            {data?.apps.limit === 2 ? "Developer plan" : "Your plan"}
          </p>
          <h3 className="font-semibold">Everything you need to ship.</h3>
          <p className="mb-4 mt-1 text-sm text-muted-foreground">
            {data?.apps.limit ?? 2} apps, {data?.storage.limitMb ?? 100} MB shared storage, and a
            secure bdapps.com link.
          </p>
          <Link
            to="/billing"
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            View pricing <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 18) return "afternoon";
  return "evening";
}
