import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Rocket, CalendarClock } from "lucide-react";
import { api } from "@/lib/api";

export default function BillingPage() {
  const { data } = useQuery({ queryKey: ["billing"], queryFn: api.billing });

  const appsPct = data ? Math.min(100, Math.round((data.appsUsed / Math.max(data.appLimit, 1)) * 100)) : 0;
  const storagePct = data
    ? Math.min(100, Math.round((data.storageUsedMb / Math.max(data.storageLimitMb, 1)) * 100))
    : 0;

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">Account</p>
          <h1 className="text-2xl font-bold tracking-tight">Billing & plan</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose the {data?.plan ?? "Developer"} plan period that works for you.
          </p>
        </div>
        <button className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90">
          <Rocket className="h-4 w-4" /> Choose plan
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-xl bg-sidebar p-6 text-sidebar-foreground">
          <div className="mb-4 flex items-center justify-between">
            <span className="rounded-full bg-primary/20 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
              {data?.plan ?? "Developer"} plan
            </span>
            <Rocket className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-xl font-bold">Simple hosting for small apps.</h2>
          <p className="mt-1 text-sm text-sidebar-foreground/60">
            Upload your files and connect a landing page without extra setup.
          </p>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-white/5 p-4">
              <p className="text-xs text-sidebar-foreground/50">1 year</p>
              <p className="text-2xl font-bold">৳199</p>
              <p className="text-xs text-sidebar-foreground/50">per year</p>
            </div>
            <div className="rounded-lg bg-white/5 p-4">
              <p className="text-xs text-sidebar-foreground/50">6 months</p>
              <p className="text-2xl font-bold">৳149</p>
              <p className="text-xs text-sidebar-foreground/50">per 6 months</p>
            </div>
          </div>

          <div className="mt-5 rounded-lg bg-card p-4 text-card-foreground">
            <div className="mb-2 flex items-center justify-between">
              <h3 className="font-semibold">Plan includes</h3>
              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                ✓ Active
              </span>
            </div>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {data?.appLimit ?? 2} hosted applications
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {data?.storageLimitMb ?? 100} MB shared storage
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Free SSL with every app link
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Upload and landing page linking
              </li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 font-semibold">Account limits</h3>
            <p className="mb-4 text-xs text-muted-foreground">Shared across all your applications.</p>
            <div className="mb-4">
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-muted-foreground">Applications</span>
                <span className="font-medium">
                  {data?.appsUsed ?? 0} / {data?.appLimit ?? "—"}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-primary" style={{ width: `${appsPct}%` }} />
              </div>
            </div>
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span className="text-muted-foreground">Storage</span>
                <span className="font-medium">
                  {data?.storageUsedMb ?? 0} / {data?.storageLimitMb ?? "—"} MB
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div className="h-full bg-emerald-500" style={{ width: `${storagePct}%` }} />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-1 flex items-center gap-1.5 font-semibold">
              <CalendarClock className="h-4 w-4" /> Valid until
            </h3>
            <p className="text-xl font-bold">
              {data?.renewsAt
                ? new Date(data.renewsAt).toLocaleDateString(undefined, {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "—"}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Renew your plan before it expires.</p>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-card">
        <h3 className="border-b border-border px-5 py-4 font-semibold">Payment history</h3>
        <div className="divide-y divide-border">
          {data?.paymentHistory.length ? (
            data.paymentHistory.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-5 py-4">
                <span className="text-sm text-muted-foreground">
                  {new Date(p.paidAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="text-sm font-medium">{p.planLabel}</span>
                <span className="text-sm font-medium">৳{p.amount}</span>
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-600">
                  ✓ Paid
                </span>
              </div>
            ))
          ) : (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No payments yet.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
