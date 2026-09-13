import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  User as UserIcon,
  ShieldCheck,
  Bell,
  Monitor,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  Smartphone,
  Laptop,
  X,
} from "lucide-react";
import { api, type User, type Session } from "@/lib/api";
import { Avatar } from "@/components/Avatar";
import { PasswordField } from "@/components/PasswordField";
import { Modal } from "@/components/Modal";
import { useToast } from "@/lib/toast";

const TABS = [
  { id: "profile", label: "Profile", icon: UserIcon },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "sessions", label: "Sessions", icon: Monitor },
  { id: "danger", label: "Danger zone", icon: AlertTriangle },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AccountPage() {
  const [tab, setTab] = useState<TabId>("profile");
  const { data } = useQuery({ queryKey: ["account"], queryFn: api.account });

  return (
    <div className="mx-auto max-w-5xl">
      <p className="mb-1 text-xs font-semibold text-primary">Account</p>
      <h1 className="text-2xl font-bold tracking-tight">Account settings</h1>
      <p className="mt-1 mb-6 text-sm text-muted-foreground">
        Manage your profile, security and how we reach you.
      </p>

      {data && !data.emailVerified && <UnverifiedBanner />}

      <div className="flex gap-8">
        <nav className="w-48 shrink-0 space-y-0.5">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                tab === t.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </nav>

        <div className="min-w-0 flex-1">
          {tab === "profile" && <ProfileTab data={data} />}
          {tab === "security" && <SecurityTab data={data} />}
          {tab === "notifications" && <NotificationsTab data={data} />}
          {tab === "sessions" && <SessionsTab />}
          {tab === "danger" && <DangerZoneTab />}
        </div>
      </div>
    </div>
  );
}

function UnverifiedBanner() {
  const toast = useToast();
  const [sending, setSending] = useState(false);

  async function resend() {
    setSending(true);
    try {
      await api.resendVerification();
      toast.push("success", "Verification email sent");
    } catch (err) {
      toast.push("error", "Couldn't send email", err instanceof Error ? err.message : undefined);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mb-6 flex items-center justify-between rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm">
      <span className="text-amber-700 dark:text-amber-400">
        Your email address isn't verified yet.
      </span>
      <button
        onClick={resend}
        disabled={sending}
        className="font-medium text-amber-700 hover:underline disabled:opacity-60 dark:text-amber-400"
      >
        {sending ? "Sending…" : "Resend link"}
      </button>
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="rounded-xl border border-border bg-card p-5">{children}</div>;
}

/* ---------------- Profile ---------------- */

function ProfileTab({ data }: { data?: User }) {
  const [fullName, setFullName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [changingEmail, setChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  useEffect(() => {
    if (data) setFullName(data.fullName);
  }, [data]);

  async function saveProfile() {
    setSavingName(true);
    try {
      await api.updateProfile({ fullName });
      await queryClient.invalidateQueries({ queryKey: ["account"] });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.push("success", "Profile updated");
    } catch (err) {
      toast.push("error", "Couldn't save changes", err instanceof Error ? err.message : undefined);
    } finally {
      setSavingName(false);
    }
  }

  async function uploadAvatar(file: File) {
    try {
      await api.uploadAvatar(file);
      await queryClient.invalidateQueries({ queryKey: ["account"] });
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.push("success", "Avatar updated");
    } catch (err) {
      toast.push("error", "Upload failed", err instanceof Error ? err.message : undefined);
    }
  }

  async function submitEmailChange() {
    setSavingEmail(true);
    try {
      await api.requestEmailChange(newEmail);
      await queryClient.invalidateQueries({ queryKey: ["account"] });
      toast.push("success", "Confirmation email sent", `Check ${newEmail} to confirm the change.`);
      setChangingEmail(false);
      setNewEmail("");
    } catch (err) {
      toast.push("error", "Couldn't update email", err instanceof Error ? err.message : undefined);
    } finally {
      setSavingEmail(false);
    }
  }

  async function cancelEmailChange() {
    try {
      await api.cancelEmailChange();
      await queryClient.invalidateQueries({ queryKey: ["account"] });
      toast.push("info", "Email change cancelled");
    } catch (err) {
      toast.push("error", "Couldn't cancel", err instanceof Error ? err.message : undefined);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex items-center gap-4">
          <Avatar name={data?.fullName} src={data?.avatarUrl} size={64} onUpload={uploadAvatar} />
          <div>
            <p className="font-semibold">{data?.fullName}</p>
            <p className="text-sm capitalize text-muted-foreground">{data?.plan} plan</p>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="mb-4 font-semibold">Profile details</h3>
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
            <div className="flex items-center gap-2">
              <input
                value={data?.email ?? ""}
                disabled
                className="w-full rounded-lg border border-input bg-muted px-3 py-2 text-sm text-muted-foreground outline-none"
              />
              {data?.emailVerified && (
                <span title="Verified" className="shrink-0">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                </span>
              )}
            </div>
          </div>
        </div>

        {data?.pendingEmail ? (
          <div className="mb-4 flex items-center justify-between rounded-lg bg-primary/5 px-3 py-2.5 text-sm">
            <span>
              Confirmation pending for <span className="font-medium">{data.pendingEmail}</span>
            </span>
            <button onClick={cancelEmailChange} className="text-xs font-medium text-muted-foreground hover:text-destructive">
              Cancel
            </button>
          </div>
        ) : changingEmail ? (
          <div className="mb-4 flex items-end gap-2">
            <div className="flex-1">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">New email</label>
              <input
                type="email"
                autoFocus
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <button
              onClick={submitEmailChange}
              disabled={savingEmail || !newEmail}
              className="rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {savingEmail ? "Sending…" : "Send link"}
            </button>
            <button
              onClick={() => setChangingEmail(false)}
              className="rounded-lg border border-border px-3 py-2 text-sm font-medium"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setChangingEmail(true)}
            className="mb-4 text-sm font-medium text-primary hover:underline"
          >
            Change email address
          </button>
        )}

        <button
          onClick={saveProfile}
          disabled={savingName || fullName === data?.fullName}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
        >
          {savingName ? "Saving…" : "Save changes"}
        </button>
      </Card>

      <Card>
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
      </Card>
    </div>
  );
}

/* ---------------- Security ---------------- */

function SecurityTab({ data }: { data?: User }) {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const [togglingTwoFA, setTogglingTwoFA] = useState(false);
  const queryClient = useQueryClient();
  const toast = useToast();

  useEffect(() => {
    setTwoFA(Boolean(data?.twoFactorEnabled));
  }, [data]);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      toast.push("error", "Passwords don't match");
      return;
    }
    setSaving(true);
    try {
      await api.changePassword({ currentPassword: current, newPassword: next });
      toast.push("success", "Password changed");
      setCurrent("");
      setNext("");
      setConfirm("");
    } catch (err) {
      toast.push("error", "Couldn't change password", err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  async function toggleTwoFA() {
    setTogglingTwoFA(true);
    try {
      if (twoFA) {
        await api.disableTwoFactor();
        setTwoFA(false);
        toast.push("info", "Two-factor authentication disabled");
      } else {
        await api.enableTwoFactor();
        setTwoFA(true);
        toast.push("success", "Two-factor authentication enabled");
      }
      await queryClient.invalidateQueries({ queryKey: ["account"] });
    } catch (err) {
      toast.push("error", "Couldn't update 2FA", err instanceof Error ? err.message : undefined);
    } finally {
      setTogglingTwoFA(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <h3 className="mb-1 font-semibold">Change password</h3>
        <p className="mb-4 text-xs text-muted-foreground">
          Use a password you haven't used elsewhere.
        </p>
        <form onSubmit={changePassword} className="space-y-3">
          <PasswordField
            label="Current password"
            value={current}
            onChange={setCurrent}
            autoComplete="current-password"
          />
          <div className="grid grid-cols-2 gap-3">
            <PasswordField
              label="New password"
              value={next}
              onChange={setNext}
              autoComplete="new-password"
              showStrength
            />
            <PasswordField
              label="Confirm new password"
              value={confirm}
              onChange={setConfirm}
              autoComplete="new-password"
            />
          </div>
          <button
            type="submit"
            disabled={saving || !current || !next}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-60"
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            {saving ? "Updating…" : "Update password"}
          </button>
        </form>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Two-factor authentication</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Require a one-time code from an authenticator app when signing in.
            </p>
          </div>
          <button
            onClick={toggleTwoFA}
            disabled={togglingTwoFA}
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              twoFA ? "bg-primary" : "bg-muted"
            }`}
            aria-pressed={twoFA}
            aria-label="Toggle two-factor authentication"
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                twoFA ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
        {twoFA && (
          <p className="mt-3 flex items-center gap-1.5 text-xs text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" /> Two-factor authentication is active on your
            account.
          </p>
        )}
      </Card>
    </div>
  );
}

/* ---------------- Notifications ---------------- */

const NOTIF_ITEMS: { key: keyof NonNullable<User["notificationPrefs"]>; label: string; description: string }[] = [
  { key: "securityAlerts", label: "Security alerts", description: "New sign-ins and password changes." },
  { key: "appStatusAlerts", label: "App status alerts", description: "When a hosted app goes down or restarts." },
  { key: "billingReminders", label: "Billing reminders", description: "Renewals, receipts and plan changes." },
  { key: "productUpdates", label: "Product updates", description: "New features and platform announcements." },
];

function NotificationsTab({ data }: { data?: User }) {
  const [prefs, setPrefs] = useState<NonNullable<User["notificationPrefs"]>>({
    productUpdates: true,
    securityAlerts: true,
    appStatusAlerts: true,
    billingReminders: true,
  });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (data?.notificationPrefs) setPrefs(data.notificationPrefs);
  }, [data]);

  async function save(next: NonNullable<User["notificationPrefs"]>) {
    setPrefs(next);
    setSaving(true);
    try {
      await api.updateNotificationPrefs(next);
    } catch (err) {
      toast.push("error", "Couldn't save preference", err instanceof Error ? err.message : undefined);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <div className="mb-1 flex items-center justify-between">
        <h3 className="font-semibold">Email notifications</h3>
        {saving && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>
      <p className="mb-4 text-xs text-muted-foreground">Choose what we email you about.</p>
      <div className="divide-y divide-border">
        {NOTIF_ITEMS.map((item) => (
          <div key={item.key} className="flex items-center justify-between py-3">
            <div>
              <p className="text-sm font-medium">{item.label}</p>
              <p className="text-xs text-muted-foreground">{item.description}</p>
            </div>
            <button
              onClick={() => save({ ...prefs, [item.key]: !prefs[item.key] })}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                prefs[item.key] ? "bg-primary" : "bg-muted"
              }`}
              aria-pressed={prefs[item.key]}
              aria-label={`Toggle ${item.label}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  prefs[item.key] ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ---------------- Sessions ---------------- */

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

function SessionsTab() {
  const { data: sessions, isLoading } = useQuery({ queryKey: ["sessions"], queryFn: api.listSessions });
  const queryClient = useQueryClient();
  const toast = useToast();
  const [revoking, setRevoking] = useState<number | null>(null);

  async function revoke(id: number) {
    setRevoking(id);
    try {
      await api.revokeSession(id);
      await queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.push("success", "Session signed out");
    } catch (err) {
      toast.push("error", "Couldn't revoke session", err instanceof Error ? err.message : undefined);
    } finally {
      setRevoking(null);
    }
  }

  async function revokeAllOthers() {
    try {
      await api.logoutAllSessions();
      await queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.push("success", "Signed out of all other sessions");
    } catch (err) {
      toast.push("error", "Couldn't sign out sessions", err instanceof Error ? err.message : undefined);
    }
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Active sessions</h3>
          <p className="text-xs text-muted-foreground">Devices currently signed in to your account.</p>
        </div>
        <button onClick={revokeAllOthers} className="text-sm font-medium text-destructive hover:underline">
          Sign out all others
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading sessions…
        </div>
      ) : sessions?.length ? (
        <div className="divide-y divide-border">
          {sessions.map((s: Session) => (
            <div key={s.id} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                  {s.device.toLowerCase().includes("mobile") ? (
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Laptop className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {s.browser} on {s.device}
                    {s.current && (
                      <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600">
                        This device
                      </span>
                    )}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    {s.location} · {s.ipAddress} ·{" "}
                    <Clock className="h-3 w-3" /> {timeAgo(s.lastActiveAt)}
                  </p>
                </div>
              </div>
              {!s.current && (
                <button
                  onClick={() => revoke(s.id)}
                  disabled={revoking === s.id}
                  className="text-xs font-medium text-muted-foreground hover:text-destructive disabled:opacity-60"
                >
                  {revoking === s.id ? "Revoking…" : "Revoke"}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-muted-foreground">No other active sessions.</p>
      )}
    </Card>
  );
}

/* ---------------- Danger zone ---------------- */

function DangerZoneTab() {
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const toast = useToast();

  async function handleDelete() {
    setDeleting(true);
    try {
      await api.deleteAccount(password);
      window.location.href = "/login";
    } catch (err) {
      toast.push("error", "Couldn't delete account", err instanceof Error ? err.message : undefined);
      setDeleting(false);
    }
  }

  return (
    <>
      <Card>
        <div className="flex items-start justify-between gap-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <div>
            <h3 className="font-semibold text-destructive">Delete account</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Permanently deletes your workspace, hosted apps and files. This can't be undone.
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="shrink-0 rounded-lg border border-destructive/40 px-3.5 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
          >
            Delete account
          </button>
        </div>
      </Card>

      <Modal
        open={open}
        onClose={() => {
          setOpen(false);
          setConfirmText("");
          setPassword("");
        }}
        title="Delete your account"
        description="This will permanently remove all hosted apps, files and billing history."
      >
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Confirm your password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Type <span className="font-semibold text-foreground">DELETE</span> to confirm
            </label>
            <input
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <button
            onClick={handleDelete}
            disabled={confirmText !== "DELETE" || !password || deleting}
            className="w-full rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-destructive-foreground disabled:opacity-50"
          >
            {deleting ? "Deleting…" : "Permanently delete my account"}
          </button>
        </div>
      </Modal>
    </>
  );
}
