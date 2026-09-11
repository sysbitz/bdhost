import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, ShieldCheck, User, ChevronRight } from "lucide-react";
import { api } from "@/lib/api";

export default function AccountPage() {
  const { data } = useQuery({ queryKey: ["account"], queryFn: api.account });
  const [fullName, setFullName] = useState("");

  useEffect(() => {
    if (data) setFullName(data.fullName);
  }, [data]);

  const initials =
    data?.fullName
      ?.split(" ")
      .map((p) => p[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() ?? "";

  return (
    <div className="mx-auto max-w-5xl">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">Account</p>
      <h1 className="text-2xl font-bold tracking-tight">Account settings</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Manage your profile and keep an eye on workspace usage.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-sm font-semibold text-primary">
                {initials || "?"}
              </div>
              <div>
                <p className="font-semibold">{data?.fullName}</p>
                <p className="text-sm capitalize text-muted-foreground">{data?.plan} plan</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2.5 text-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <div>
                <p className="font-medium text-emerald-700">Account verified</p>
                {data?.emailVerifiedAt && (
                  <p className="text-xs text-emerald-700/70">
                    Your email was verified on{" "}
                    {new Date(data.emailVerifiedAt).toLocaleDateString(undefined, {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                    .
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-3 flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="h-4 w-4" /> Security
            </h3>
            <button className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-muted">
              Change password
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Profile details</h3>
                <p className="text-xs text-muted-foreground">This information is only visible to you.</p>
              </div>
              <User className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mb-4 grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Full name</label>
                <input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-muted-foreground">Email address</label>
                <input
                  value={data?.email ?? ""}
                  disabled
                  className="w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground outline-none"
                />
              </div>
            </div>
            <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90">
              Save changes
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Workspace usage</h3>
                <p className="text-xs capitalize text-muted-foreground">
                  {data?.plan} plan
                  {data?.planRenewsAt &&
                    ` · renews ${new Date(data.planRenewsAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}`}
                </p>
              </div>
              <a href="/billing" className="text-sm font-medium text-primary hover:underline">
                Billing
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">Applications</p>
                <p className="text-lg font-bold">— / {data?.appLimit}</p>
              </div>
              <div className="rounded-lg bg-muted/60 p-3">
                <p className="text-xs text-muted-foreground">Storage</p>
                <p className="text-lg font-bold">— / {data?.storageLimitMb} MB</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
