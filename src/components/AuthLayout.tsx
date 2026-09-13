import { Link } from "react-router-dom";
import { Rocket, Check } from "lucide-react";

const LOG_LINES: { text: string; tone?: "muted" | "accent" | "success" }[] = [
  { text: "$ apphost deploy ./dist", tone: "muted" },
  { text: "→ uploading 42 files (2.1 MB)" },
  { text: "→ provisioning subdomain…" },
  { text: "✓ live at nova-app.lokhalapps.com", tone: "success" },
  { text: "$ apphost deploy ./dist", tone: "muted" },
  { text: "→ uploading 18 files (860 KB)" },
  { text: "✓ live at pixel-crm.lokhalapps.com", tone: "success" },
];

export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
}: {
  eyebrow?: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* Form column */}
      <div className="flex w-full flex-col justify-center px-6 py-10 sm:px-10 lg:w-[46%] lg:px-16 xl:px-20">
        <div className="mx-auto w-full max-w-sm">
          <Link to="/" className="mb-10 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Rocket className="h-4 w-4" />
            </div>
            <span className="text-lg font-bold tracking-tight">AppHost</span>
          </Link>

          {eyebrow && (
            <p className="mb-2 text-xs font-medium text-primary">{eyebrow}</p>
          )}
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>

          <div className="mt-7">{children}</div>

          {footer && <div className="mt-6 text-sm text-muted-foreground">{footer}</div>}
        </div>
      </div>

      {/* Visual column */}
      <div className="relative hidden overflow-hidden bg-sidebar lg:flex lg:w-[54%] lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle, hsl(var(--sidebar-foreground)) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative">
          <p className="max-w-md text-2xl font-semibold leading-snug text-sidebar-foreground">
            Ship a live app in the time it takes to make coffee.
          </p>
          <p className="mt-3 max-w-sm text-sm text-sidebar-foreground/60">
            Upload your build, get a subdomain, and manage every deployment from one workspace.
          </p>
        </div>

        <div className="relative rounded-xl border border-sidebar-border bg-sidebar-accent/40 p-4 font-mono text-[13px] leading-relaxed shadow-2xl backdrop-blur">
          <div className="mb-2.5 flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/70" />
          </div>
          {LOG_LINES.map((line, i) => (
            <p
              key={i}
              className={
                line.tone === "success"
                  ? "text-emerald-400"
                  : line.tone === "muted"
                    ? "mt-2 text-sidebar-foreground/90"
                    : "text-sidebar-foreground/50"
              }
            >
              {line.text}
            </p>
          ))}
          <span className="mt-1 inline-block h-3.5 w-1.5 animate-pulse bg-sidebar-foreground/60 align-middle" />
        </div>

        <div className="relative flex items-center gap-6 text-sidebar-foreground/70">
          <div className="flex items-center gap-1.5 text-xs">
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            99.9% uptime
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            Deploys in ~30s
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Check className="h-3.5 w-3.5 text-emerald-400" />
            Free SSL &amp; subdomain
          </div>
        </div>
      </div>
    </div>
  );
}
