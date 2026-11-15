import { useCallback, useState, type FormEvent } from "react";
import {
  ArrowUpRight,
  BadgeCheck,
  Building2,
  CalendarDays,
  Church,
  HandHeart,
  Images,
  LayoutDashboard,
  Sprout,
  LogOut,
  Menu,
  MessageSquareText,
  Megaphone,
  ShieldCheck,
  Store,
  Users,
  X,
} from "lucide-react";
import axios from "axios";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { getAdminDashboard } from "../../services/adminService";

const navigation = [
  { label: "Dashboard", to: "/admin", icon: LayoutDashboard },
  { label: "Events", to: "/admin/events", icon: CalendarDays },
  { label: "Initiatives", to: "/admin/initiatives", icon: Sprout },
  { label: "Festivals", to: "/admin/festivals", icon: Church },
  { label: "Announcements", to: "/admin/announcements", icon: Megaphone },
  { label: "Membership", to: "/admin/membership", icon: Users },
  { label: "Volunteers", to: "/admin/volunteers", icon: HandHeart },
  { label: "Business directory", to: "/admin/businesses", icon: Store },
  { label: "Sponsors", to: "/admin/sponsors", icon: BadgeCheck },
  { label: "Gallery", to: "/admin/gallery", icon: Images },
  { label: "Contact messages", to: "/admin/messages", icon: MessageSquareText },
  { label: "Club profile", to: "/admin/club-profile", icon: Building2 },
];

export function AdminLayout() {
  const [authorization, setAuthorization] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { pathname } = useLocation();
  const onLogout = useCallback(() => {
    setHasUnsavedChanges(false);
    setAuthorization(null);
  }, []);
  const onUnsavedChangesChange = useCallback(
    (hasChanges: boolean) => setHasUnsavedChanges(hasChanges),
    [],
  );
  const activeSection =
    navigation.find(
      ({ to }) => pathname === to || (to !== "/admin" && pathname.startsWith(`${to}/`)),
    )?.label ?? "Dashboard";

  if (!authorization) {
    return (
      <AdminLogin
        onAuthenticated={setAuthorization}
      />
    );
  }

  return (
    <div className="admin-shell min-h-screen bg-[#f7f8fa] text-slate-900">
      {isSidebarOpen && (
        <button
          aria-label="Close navigation menu"
          className="fixed inset-0 z-30 bg-slate-950/40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[264px] flex-col border-r border-slate-200 bg-white transition-transform duration-200 lg:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-slate-100 px-6">
          <a className="flex items-center gap-3" href="/admin" aria-label="nabajagaran-club admin home">
            <span className="grid size-10 place-items-center rounded-xl bg-[#7b1e2b] text-lg font-semibold text-white">
              N
            </span>
            <span>
              <span className="block font-semibold tracking-tight text-slate-900">nabajagaran-club</span>
              <span className="block text-xs text-slate-500">ADMINISTRATION</span>
            </span>
          </a>
          <button
            aria-label="Close navigation menu"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-4 pt-7">
          <p className="px-3 pb-3 text-[10px] font-semibold tracking-[0.16em] text-slate-400">
            WORKSPACE
          </p>
          <nav aria-label="Admin navigation" className="space-y-1">
            {navigation.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === "/admin"}
                onClick={(event) => {
                  if (pathname !== to && hasUnsavedChanges) {
                    if (!window.confirm("Leave this page and discard unsaved changes?")) {
                      event.preventDefault();
                      return;
                    }
                    setHasUnsavedChanges(false);
                  }
                  setIsSidebarOpen(false);
                }}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium ${
                    isActive
                      ? "bg-[#f8eff0] text-[#7b1e2b]"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`
                }
                title={
                  to === "/admin" || label === "Announcements" || label === "Club profile"
                    || label === "Initiatives" || label === "Festivals"
                    ? undefined
                    : "This module is a route placeholder"
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={17} strokeWidth={1.8} />
                    <span className="flex-1">{label}</span>
                    {to !== "/admin" && label !== "Announcements" && label !== "Club profile"
                      && label !== "Initiatives" && label !== "Festivals" && (
                      <span
                        className={`rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                          isActive
                            ? "bg-white/70 text-[#7b1e2b]"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        Soon
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <ShieldCheck size={15} className="text-emerald-600" />
              Protected workspace
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Admin access is verified by the server for every dashboard request.
            </p>
          </div>
          <button
            className="mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[13px] font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            onClick={() => {
              if (hasUnsavedChanges && !window.confirm("Sign out and discard unsaved changes?")) return;
              setHasUnsavedChanges(false);
              setAuthorization(null);
            }}
          >
            <LogOut size={17} />
            Sign out
          </button>
        </div>
      </aside>

      <div className="min-h-screen lg:pl-[264px]">
        <header className="sticky top-0 z-20 flex h-[76px] items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur sm:px-8">
          <div className="flex items-center gap-3">
            <button
              aria-label="Open navigation menu"
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={20} />
            </button>
            <div>
              <p className="text-xs text-slate-400">Workspace / {activeSection}</p>
              <h1 className="mt-0.5 text-sm font-semibold text-slate-800">{activeSection}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/"
              className="hidden items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-[#7b1e2b] sm:flex"
            >
              View public site <ArrowUpRight size={14} />
            </a>
            <span className="grid size-9 place-items-center rounded-full bg-[#f8eff0] text-xs font-semibold text-[#7b1e2b]">
              AD
            </span>
          </div>
        </header>
        <main className="mx-auto max-w-[1440px] px-5 py-8 sm:px-8 lg:px-10">
          <Outlet context={{ authorization, onLogout, onUnsavedChangesChange }} />
        </main>
      </div>
    </div>
  );
}

function AdminLogin({
  onAuthenticated,
}: {
  onAuthenticated: (authorization: string) => void;
}) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    const encodedCredentials = Array.from(
      new TextEncoder().encode(`${username}:${password}`),
      (byte) => String.fromCharCode(byte),
    ).join("");
    try {
      const authorization = `Basic ${window.btoa(encodedCredentials)}`;
      await getAdminDashboard(authorization);
      onAuthenticated(authorization);
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      setErrorMessage(
        status === 401 || status === 403
          ? "Those credentials could not be verified. Please try again."
          : "The admin service is unavailable. Please try again in a moment.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="admin-shell flex min-h-screen items-center justify-center bg-[#f7f8fa] px-5 py-12">
      <section className="w-full max-w-[420px] rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_16px_50px_-32px_rgba(15,23,42,0.28)] sm:p-10">
        <div className="mb-8 flex items-center gap-3">
          <span className="grid size-11 place-items-center rounded-xl bg-[#7b1e2b] text-lg font-semibold text-white">
            N
          </span>
          <div>
            <p className="font-semibold tracking-tight text-slate-900">nabajagaran-club</p>
            <p className="text-xs text-slate-500">Administrator sign in</p>
          </div>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Welcome back</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Sign in to manage the club workspace. Your access is verified securely by the server.
        </p>
        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-700">
            Username
            <input
              autoComplete="username"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#7b1e2b] focus:ring-2 focus:ring-[#7b1e2b]/10"
              onChange={(event) => setUsername(event.target.value)}
              required
              value={username}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Password
            <input
              autoComplete="current-password"
              className="mt-1.5 w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm outline-none transition focus:border-[#7b1e2b] focus:ring-2 focus:ring-[#7b1e2b]/10"
              onChange={(event) => setPassword(event.target.value)}
              required
              type="password"
              value={password}
            />
          </label>
          {errorMessage && (
            <p className="rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-700" role="alert">
              {errorMessage}
            </p>
          )}
          <button
            className="mt-2 flex w-full items-center justify-center rounded-lg bg-[#7b1e2b] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#641925] disabled:cursor-wait disabled:opacity-70"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Verifying access..." : "Sign in"}
          </button>
        </form>
        <a className="mt-6 inline-block text-xs font-medium text-slate-500 hover:text-[#7b1e2b]" href="/">
          ← Return to public website
        </a>
      </section>
    </main>
  );
}
