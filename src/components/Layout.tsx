import { useEffect, useRef, useState } from "react";
import { NavLink, useNavigate, Link } from "react-router-dom";
import {
  LayoutGrid,
  Package,
  Folder,
  CreditCard,
  Settings,
  HelpCircle,
  Bell,
  ChevronDown,
  Rocket,
  User,
  LogOut,
  ShieldAlert,
} from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Avatar } from "@/components/Avatar";

const navItems = [
  { to: "/", label: "Overview", icon: LayoutGrid, end: true },
  { to: "/applications", label: "Applications", icon: Package },
  { to: "/files", label: "File manager", icon: Folder },
];

const accountItems = [
  { to: "/billing", label: "Billing & plan", icon: CreditCard },
  { to: "/account", label: "Account settings", icon: Settings },
];

function navLinkClass(isActive: boolean) {
  return [
    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
    isActive
      ? "bg-primary text-primary-foreground"
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
  ].join(" ");
}

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: user } = useQuery({ queryKey: ["me"], queryFn: api.me, retry: false });
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function handleLogout() {
    await api.logout();
    queryClient.clear();
    navigate("/login");
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="flex w-60 shrink-0 flex-col bg-sidebar px-4 py-5 text-sidebar-foreground">
        <div className="mb-8 flex items-center gap-2 px-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary font-bold text-primary-foreground">
            <Rocket className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold tracking-tight">AppHost</span>
        </div>

        <div className="mb-6 rounded-xl bg-sidebar-accent/50 px-3 py-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-wide text-sidebar-foreground/50">
              Workspace
            </span>
            <span className="flex items-center gap-1 text-xs font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Active
            </span>
          </div>
          <p className="text-sm font-semibold">{user?.fullName ? `${user.fullName}'s workspace` : "Your workspace"}</p>
          <p className="text-xs text-sidebar-foreground/50">
            {user?.plan ?? "developer"} plan
          </p>
        </div>

        <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wide text-sidebar-foreground/40">
          Workspace
        </p>
        <nav className="mb-6 flex flex-col gap-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => navLinkClass(isActive)}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <p className="mb-2 px-1 text-[11px] font-medium uppercase tracking-wide text-sidebar-foreground/40">
          Account
        </p>
        <nav className="flex flex-col gap-1">
          {accountItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => navLinkClass(isActive)}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto">
          <button
            onClick={handleLogout}
            className="w-full rounded-lg px-3 py-2 text-left text-xs font-medium text-sidebar-foreground/50 hover:text-sidebar-foreground"
          >
            Sign out
          </button>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-8 py-3.5">
          <div className="text-sm text-muted-foreground">
            Workspace <span className="mx-1">/</span>{" "}
            <span className="font-medium text-foreground">Overview</span>
          </div>
          <div className="flex items-center gap-4">
            {user && !user.emailVerified && (
              <Link
                to="/account"
                className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-600"
                title="Verify your email"
              >
                <ShieldAlert className="h-3.5 w-3.5" /> Verify email
              </Link>
            )}
            <HelpCircle className="h-5 w-5 text-muted-foreground" />
            <div className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" />
            </div>

            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full pl-1 pr-2 text-sm hover:bg-muted"
              >
                <Avatar name={user?.fullName} src={user?.avatarUrl} size={28} />
                <span className="font-medium">{user?.fullName ?? "Account"}</span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-xl border border-border bg-card py-1.5 shadow-lg">
                  <div className="border-b border-border px-3 pb-2 pt-1">
                    <p className="truncate text-sm font-medium">{user?.fullName}</p>
                    <p className="truncate text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                  <Link
                    to="/account"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  >
                    <User className="h-4 w-4 text-muted-foreground" /> Profile
                  </Link>
                  <Link
                    to="/account"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                  >
                    <Settings className="h-4 w-4 text-muted-foreground" /> Account settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 px-8 py-8">{children}</main>
      </div>
    </div>
  );
}
