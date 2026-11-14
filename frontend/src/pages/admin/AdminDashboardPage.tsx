import { useEffect, useState } from "react";
import axios from "axios";
import {
  ArrowRight,
  CalendarDays,
  CircleAlert,
  Clock3,
  Megaphone,
  RefreshCw,
  Store,
} from "lucide-react";
import { Link, useOutletContext } from "react-router-dom";
import { getAdminDashboard } from "../../services/adminService";
import type { AdminDashboardResponse } from "../../types/api";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function AdminDashboardPage() {
  const { authorization, onLogout } = useOutletContext<{
    authorization: string;
    onLogout: () => void;
  }>();
  const [dashboard, setDashboard] = useState<AdminDashboardResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCurrent = true;

    getAdminDashboard(authorization)
      .then((response) => {
        if (isCurrent) setDashboard(response);
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          if (axios.isAxiosError(error) && (error.response?.status === 401 || error.response?.status === 403)) {
            onLogout();
          } else {
            setHasError(true);
          }
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [authorization, onLogout]);

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
        <p className="text-sm font-medium text-[#7b1e2b]">
          {new Intl.DateTimeFormat("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(new Date())}
        </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          Good {new Date().getHours() < 12 ? "morning" : new Date().getHours() < 17 ? "afternoon" : "evening"}, Admin
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Here&apos;s what&apos;s happening with your community today.
          </p>
        </div>
        <Link
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-600 shadow-sm hover:border-slate-300"
          to="/"
        >
          View public website <ArrowRight size={14} />
        </Link>
      </section>

      <section aria-label="Community summary" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <SummaryCard
          icon={CalendarDays}
          label="Upcoming events"
          value={dashboard?.upcomingEvents}
          accent="bg-[#f8eff0] text-[#7b1e2b]"
          isLoading={isLoading}
        />
        <SummaryCard
          icon={Megaphone}
          label="Published announcements"
          value={dashboard?.publishedAnnouncements}
          accent="bg-amber-50 text-amber-700"
          isLoading={isLoading}
        />
        <SummaryCard
          icon={Store}
          label="Approved businesses"
          value={dashboard?.approvedBusinesses}
          accent="bg-emerald-50 text-emerald-700"
          isLoading={isLoading}
        />
      </section>

      {hasError ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-5" role="alert">
          <div className="flex items-start gap-3">
            <CircleAlert className="mt-0.5 text-red-600" size={18} />
            <div>
              <h3 className="text-sm font-semibold text-red-900">Dashboard data couldn&apos;t load</h3>
              <p className="mt-1 text-sm text-red-700">
                Check your connection and sign-in, then refresh the page.
              </p>
              <button
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-red-800 hover:underline"
                onClick={() => window.location.reload()}
              >
                <RefreshCw size={13} /> Refresh dashboard
              </button>
            </div>
          </div>
        </section>
      ) : (
        <section className="grid gap-5 xl:grid-cols-[1.55fr_1fr]">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Upcoming events</h3>
                <p className="mt-1 text-xs text-slate-500">Published events open to the community</p>
              </div>
              <CalendarDays size={17} className="text-slate-400" />
            </div>
            {isLoading ? (
              <LoadingRows />
            ) : dashboard?.events.length ? (
              <div className="divide-y divide-slate-100">
                {dashboard.events.map((event) => (
                  <article className="flex items-center gap-4 px-5 py-4" key={event.id}>
                    <div className="grid size-11 shrink-0 place-items-center rounded-lg bg-[#f8eff0] text-center text-[#7b1e2b]">
                      <span className="text-[9px] font-semibold uppercase leading-none">
                        {dateFormatter.format(new Date(event.startAt)).split(" ")[1]?.replace(",", "")}
                      </span>
                      <span className="text-sm font-bold leading-none">
                        {new Date(event.startAt).getDate()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate text-sm font-semibold text-slate-800">{event.title}</h4>
                      <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
                        <Clock3 size={12} />
                        {dateFormatter.format(new Date(event.startAt))}
                        {event.venue ? ` · ${event.venue}` : ""}
                      </p>
                    </div>
                    <span className="hidden rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700 sm:inline-flex">
                      Published
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyPanel message="No published upcoming events yet." />
            )}
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-800">Recent announcements</h3>
                <p className="mt-1 text-xs text-slate-500">The latest community updates</p>
              </div>
              <Megaphone size={17} className="text-slate-400" />
            </div>
            {isLoading ? (
              <LoadingRows />
            ) : dashboard?.announcements.length ? (
              <div className="divide-y divide-slate-100">
                {dashboard.announcements.map((announcement) => (
                  <article className="px-5 py-4" key={announcement.id}>
                    <h4 className="text-sm font-semibold leading-5 text-slate-800">
                      {announcement.title}
                    </h4>
                    <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-slate-500">
                      {announcement.content}
                    </p>
                    <p className="mt-2 text-[10px] font-medium text-slate-400">
                      {announcement.publishedAt
                        ? dateFormatter.format(new Date(announcement.publishedAt))
                        : dateFormatter.format(new Date(announcement.createdAt))}
                    </p>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyPanel message="No published announcements yet." />
            )}
          </div>
        </section>
      )}

      <p className="text-center text-[11px] text-slate-400">
        Summary data is limited to public events, announcements, and approved directory listings.
      </p>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  accent,
  isLoading,
}: {
  icon: typeof CalendarDays;
  label: string;
  value?: number;
  accent: string;
  isLoading: boolean;
}) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <span className={`grid size-9 place-items-center rounded-lg ${accent}`}>
          <Icon size={17} />
        </span>
      </div>
      {isLoading ? (
        <div className="mt-4 h-8 w-16 animate-pulse rounded bg-slate-100" />
      ) : (
        <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">{value ?? "—"}</p>
      )}
      <p className="mt-2 text-[11px] text-slate-400">Live from club records</p>
    </article>
  );
}

function LoadingRows() {
  return (
    <div aria-label="Loading dashboard data" className="space-y-4 px-5 py-5">
      {[0, 1, 2].map((row) => (
        <div className="flex items-center gap-3" key={row}>
          <div className="size-10 animate-pulse rounded-lg bg-slate-100" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
            <div className="h-2.5 w-1/2 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return <p className="px-5 py-8 text-center text-sm text-slate-500">{message}</p>;
}
