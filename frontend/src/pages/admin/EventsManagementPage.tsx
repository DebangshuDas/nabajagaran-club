import axios from "axios";
import { Eye, Pencil, Plus, Send, Trash2, Undo2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  AdminDataTable,
  type AdminDataTableColumn,
} from "../../components/admin/AdminDataTable";
import { AdminFilter } from "../../components/admin/AdminFilter";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminPagination } from "../../components/admin/AdminPagination";
import { AdminSearch } from "../../components/admin/AdminSearch";
import { AdminToast } from "../../components/admin/AdminToast";
import { ConfirmDialog } from "../../components/admin/ConfirmDialog";
import { StatusBadge } from "../../components/admin/StatusBadge";
import {
  createAdminEvent,
  deleteAdminEvent,
  getAdminEvent,
  getAdminEvents,
  publishAdminEvent,
  unpublishAdminEvent,
  updateAdminEvent,
} from "../../services/adminService";
import type {
  AdminEventQuery,
  EventRequest,
  EventResponse,
  EventStatus,
} from "../../types/api";
import { EventForm } from "./EventForm";

type AdminOutletContext = {
  authorization: string;
  onLogout: () => void;
};

type BackendError = {
  message?: string;
};

const pageSize = 10;
const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});
const eventStatuses: EventStatus[] = ["UPCOMING", "ONGOING", "COMPLETED"];

function isEventStatus(value: string): value is EventStatus {
  return eventStatuses.some((eventStatus) => eventStatus === value);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateTimeFormatter.format(date);
}

function getErrorMessage(error: unknown, fallback: string, onLogout: () => void) {
  if (axios.isAxiosError<BackendError>(error)) {
    if (error.response?.status === 401 || error.response?.status === 403) {
      onLogout();
      return "Your admin access could not be verified. Please sign in again.";
    }
    if (error.response?.data?.message) return error.response.data.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function statusVariant(status: EventStatus) {
  if (status === "UPCOMING") return "info";
  if (status === "ONGOING") return "success";
  return "neutral";
}

export function EventsManagementPage() {
  const { authorization, onLogout } = useOutletContext<AdminOutletContext>();
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [totalEvents, setTotalEvents] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<EventStatus | "">("");
  const [publicationFilter, setPublicationFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<EventResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mutatingEventId, setMutatingEventId] = useState<number | null>(null);
  const [viewedEvent, setViewedEvent] = useState<EventResponse | null>(null);
  const [viewingEventId, setViewingEventId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  const publishedFilter =
    publicationFilter === "" ? undefined : publicationFilter === "published";

  function refreshEvents() {
    setIsLoading(true);
    setLoadError(null);
    setRefreshKey((current) => current + 1);
  }

  useEffect(() => {
    let isCurrent = true;
    const query: AdminEventQuery = {
      search,
      status,
      published: publishedFilter,
      page: page - 1,
      size: pageSize,
    };

    getAdminEvents(authorization, query)
      .then((response) => {
        if (
          !Array.isArray(response.content)
          || typeof response.totalElements !== "number"
          || typeof response.totalPages !== "number"
        ) {
          throw new Error("The event service returned an unexpected response.");
        }
        if (!isCurrent) return;

        setEvents(response.content);
        setTotalEvents(response.totalElements);
      })
      .catch((error: unknown) => {
        if (isCurrent) setLoadError(getErrorMessage(error, "Events could not be loaded.", onLogout));
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [authorization, onLogout, page, publishedFilter, refreshKey, search, status]);

  async function saveEvent(request: EventRequest) {
    setIsSubmitting(true);
    setToast(null);
    try {
      if (editingEvent) {
        await updateAdminEvent(authorization, editingEvent.id, request);
        setToast({ message: "Event changes saved.", variant: "success" });
      } else {
        await createAdminEvent(authorization, request);
        setToast({ message: "Event created.", variant: "success" });
        setPage(1);
      }
      setIsFormOpen(false);
      setEditingEvent(null);
      setViewedEvent(null);
      refreshEvents();
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "The event could not be saved.", onLogout),
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function changePublication(event: EventResponse) {
    setMutatingEventId(event.id);
    setToast(null);
    try {
      if (event.published) {
        await unpublishAdminEvent(authorization, event.id);
        setToast({ message: "Event unpublished.", variant: "success" });
      } else {
        await publishAdminEvent(authorization, event.id);
        setToast({ message: "Event published.", variant: "success" });
      }
      refreshEvents();
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "Publication status could not be changed.", onLogout),
        variant: "error",
      });
    } finally {
      setMutatingEventId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setToast(null);
    try {
      await deleteAdminEvent(authorization, pendingDelete.id);
      setToast({ message: "Event deleted.", variant: "success" });
      setPendingDelete(null);
      setViewedEvent(null);
      setPage(1);
      refreshEvents();
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "The event could not be deleted.", onLogout),
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  async function viewEvent(event: EventResponse) {
    setViewingEventId(event.id);
    setToast(null);
    try {
      setViewedEvent(await getAdminEvent(authorization, event.id));
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "Event details could not be loaded.", onLogout),
        variant: "error",
      });
    } finally {
      setViewingEventId(null);
    }
  }

  const columns: AdminDataTableColumn<EventResponse>[] = [
    {
      id: "title",
      header: "Event",
      render: (event) => (
        <div className="min-w-40">
          <p className="font-semibold text-slate-900">{event.title}</p>
          {event.shortDescription && (
            <p className="mt-1 max-w-xs truncate text-xs text-slate-500">{event.shortDescription}</p>
          )}
        </div>
      ),
    },
    { id: "type", header: "Type", render: (event) => event.eventType },
    { id: "start", header: "Start date", render: (event) => formatDateTime(event.startAt) },
    { id: "venue", header: "Venue", render: (event) => event.venue || "—" },
    {
      id: "status",
      header: "Status",
      render: (event) => <StatusBadge label={event.status} variant={statusVariant(event.status)} />,
    },
    {
      id: "published",
      header: "Published",
      render: (event) => (
        <StatusBadge
          label={event.published ? "Published" : "Unpublished"}
          variant={event.published ? "success" : "warning"}
        />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      className: "whitespace-nowrap",
      render: (event) => (
        <div className="flex items-center gap-1">
          <button
            aria-label={`View ${event.title}`}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
            disabled={viewingEventId === event.id}
            onClick={() => void viewEvent(event)}
            title="View event"
            type="button"
          >
            <Eye size={16} />
          </button>
          <button
            aria-label={`Edit ${event.title}`}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            onClick={() => {
              setEditingEvent(event);
              setIsFormOpen(true);
              setViewedEvent(null);
            }}
            title="Edit event"
            type="button"
          >
            <Pencil size={16} />
          </button>
          <button
            aria-label={`${event.published ? "Unpublish" : "Publish"} ${event.title}`}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
            disabled={mutatingEventId === event.id}
            onClick={() => void changePublication(event)}
            title={event.published ? "Unpublish event" : "Publish event"}
            type="button"
          >
            {event.published ? <Undo2 size={16} /> : <Send size={16} />}
          </button>
          <button
            aria-label={`Delete ${event.title}`}
            className="rounded-md p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
            disabled={mutatingEventId === event.id}
            onClick={() => setPendingDelete(event)}
            title="Delete event"
            type="button"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Events Management"
        description="Create, update, publish, and archive club events."
        actions={
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-[#7b1e2b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#641925]"
            onClick={() => {
              setEditingEvent(null);
              setIsFormOpen(true);
              setViewedEvent(null);
            }}
            type="button"
          >
            <Plus size={16} />
            Create event
          </button>
        }
      />

      {toast && (
        <AdminToast
          message={toast.message}
          onDismiss={() => setToast(null)}
          variant={toast.variant}
        />
      )}

      {isFormOpen && (
        <EventForm
          key={editingEvent?.id ?? "new-event"}
          event={editingEvent}
          isSubmitting={isSubmitting}
          onCancel={() => {
            if (isSubmitting) return;
            setIsFormOpen(false);
            setEditingEvent(null);
          }}
          onSubmit={(request) => void saveEvent(request)}
        />
      )}

      <section aria-label="Event filters" className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-3">
        <AdminSearch
          id="event-search"
          label="Search by title"
          placeholder="Search events"
          value={search}
          onChange={(value) => {
            setIsLoading(true);
            setLoadError(null);
            setSearch(value);
            setPage(1);
          }}
        />
        <AdminFilter
          id="event-status-filter"
          label="Status"
          value={status}
          onChange={(value) => {
            if (value === "" || isEventStatus(value)) {
              setIsLoading(true);
              setLoadError(null);
              setStatus(value);
              setPage(1);
            }
          }}
          options={[
            { label: "All statuses", value: "" },
            { label: "Upcoming", value: "UPCOMING" },
            { label: "Ongoing", value: "ONGOING" },
            { label: "Completed", value: "COMPLETED" },
          ]}
        />
        <AdminFilter
          id="event-publication-filter"
          label="Publication"
          value={publicationFilter}
          onChange={(value) => {
            setIsLoading(true);
            setLoadError(null);
            setPublicationFilter(value);
            setPage(1);
          }}
          options={[
            { label: "All publication statuses", value: "" },
            { label: "Published", value: "published" },
            { label: "Unpublished", value: "unpublished" },
          ]}
        />
      </section>

      <AdminDataTable
        columns={columns}
        emptyMessage="No events match these filters."
        error={loadError}
        getRowKey={(event) => event.id}
        isLoading={isLoading}
        loadingMessage="Loading events..."
        rows={events}
      />

      <AdminPagination
        page={page}
        pageSize={pageSize}
        totalItems={totalEvents}
        onPageChange={(nextPage) => {
          setIsLoading(true);
          setLoadError(null);
          setPage(nextPage);
        }}
      />

      {viewedEvent && (
        <section
          aria-labelledby="event-details-heading"
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900" id="event-details-heading">
                {viewedEvent.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">Event details</p>
            </div>
            <button
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => setViewedEvent(null)}
              type="button"
            >
              Close
            </button>
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-slate-500">Description</dt>
              <dd className="mt-1 whitespace-pre-wrap text-slate-800">{viewedEvent.description}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Schedule</dt>
              <dd className="mt-1 text-slate-800">
                {formatDateTime(viewedEvent.startAt)}
                {viewedEvent.endAt ? ` – ${formatDateTime(viewedEvent.endAt)}` : ""}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Venue and address</dt>
              <dd className="mt-1 text-slate-800">
                {[viewedEvent.venue, viewedEvent.address].filter(Boolean).join(" · ") || "—"}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Capacity</dt>
              <dd className="mt-1 text-slate-800">{viewedEvent.capacity ?? "Not specified"}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Image URL</dt>
              <dd className="mt-1 break-all text-slate-800">{viewedEvent.imageUrl || "—"}</dd>
            </div>
          </dl>
        </section>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete event?"
        description={
          pendingDelete
            ? `“${pendingDelete.title}” will be removed from event management and hidden from public listings.`
            : "This event will be removed from event management."
        }
        confirmLabel="Delete event"
        destructive
        isConfirming={isDeleting}
        onCancel={() => {
          if (!isDeleting) setPendingDelete(null);
        }}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  );
}
