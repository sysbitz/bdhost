import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, MailCheck, XCircle } from "lucide-react";
import { api } from "@/lib/api";
import { AuthLayout } from "@/components/AuthLayout";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const navigate = useNavigate();

  if (token) return <ConfirmToken token={token} onDone={() => navigate("/")} />;

  return <CheckInbox />;
}

function ConfirmToken({ token, onDone }: { token: string; onDone: () => void }) {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const queryClient = useQueryClient();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    api
      .verifyEmail(token)
      .then(async () => {
        await queryClient.invalidateQueries({ queryKey: ["me"] });
        await queryClient.invalidateQueries({ queryKey: ["account"] });
        setStatus("success");
      })
      .catch(() => setStatus("error"));
  }, [token, queryClient]);

  if (status === "loading") {
    return (
      <AuthLayout eyebrow="Email verification" title="Confirming your email" subtitle="">
        <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Verifying your link…
        </div>
      </AuthLayout>
    );
  }

  if (status === "error") {
    return (
      <AuthLayout
        eyebrow="Email verification"
        title="Link expired"
        subtitle=""
        footer={
          <Link to="/verify-email" className="font-medium text-primary hover:underline">
            Request a new link
          </Link>
        }
      >
        <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-5">
          <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
          <p className="text-sm text-muted-foreground">
            This verification link is invalid or has expired. Request a new one from your account
            settings.
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout eyebrow="Email verification" title="Email verified" subtitle="">
      <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-5">
        <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-500" />
        <div>
          <p className="text-sm">Your email address is now verified.</p>
          <button
            onClick={onDone}
            className="mt-3 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Go to workspace
          </button>
        </div>
      </div>
    </AuthLayout>
  );
}

function CheckInbox() {
  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearInterval(t);
  }, [cooldown]);

  async function handleResend() {
    setError(null);
    setSending(true);
    try {
      await api.resendVerification();
      setCooldown(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't resend the email");
    } finally {
      setSending(false);
    }
  }

  return (
    <AuthLayout
      eyebrow="Email verification"
      title="Verify your email"
      subtitle=""
      footer={
        <Link to="/login" className="font-medium text-primary hover:underline">
          Back to sign in
        </Link>
      }
    >
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
          <MailCheck className="h-5 w-5 text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">
          We've sent a verification link to your email address. Click it to activate every
          feature of your workspace.
        </p>
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
        <button
          onClick={handleResend}
          disabled={sending || cooldown > 0}
          className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-60"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : sending ? "Sending…" : "Resend email"}
        </button>
      </div>
    </AuthLayout>
  );
}
