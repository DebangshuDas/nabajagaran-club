import axios from "axios";
import { Eye, Pencil, Plus, Send, Trash2, Undo2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
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
  createAdminInitiative,
  deleteAdminInitiative,
  getAdminInitiative,
  getAdminInitiatives,
  getAdminEvents,
  publishAdminInitiative,
  unpublishAdminInitiative,
  updateAdminInitiative,
} from "../../services/adminService";
import type {
  AdminCommunityInitiativeQuery,
  CommunityInitiativeRequest,
  CommunityInitiativeResponse,
  EventResponse,
  InitiativeStatus,
} from "../../types/api";
import { InitiativeForm } from "./InitiativeForm";

type AdminOutletContext = {
  authorization: string;
  onLogout: () => void;
  onUnsavedChangesChange: (hasChanges: boolean) => void;
};

type BackendError = {
  message?: string;
};

const pageSize = 10;
const dateFormatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});
const initiativeStatuses: InitiativeStatus[] = ["PLANNED", "ACTIVE", "COMPLETED"];

function isInitiativeStatus(value: string): value is InitiativeStatus {
  return initiativeStatuses.some((status) => status === value);
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
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

function statusVariant(status: InitiativeStatus) {
  if (status === "ACTIVE") return "success";
  if (status === "PLANNED") return "info";
  return "neutral";
}

export function InitiativesManagementPage() {
  const { authorization, onLogout, onUnsavedChangesChange } =
    useOutletContext<AdminOutletContext>();
  const [initiatives, setInitiatives] = useState<CommunityInitiativeResponse[]>([]);
  const [totalInitiatives, setTotalInitiatives] = useState(0);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [eventSearch, setEventSearch] = useState("");
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [isEventsLoading, setIsEventsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<InitiativeStatus | "">("");
  const [publicationFilter, setPublicationFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingInitiative, setEditingInitiative] =
    useState<CommunityInitiativeResponse | null>(null);
  const [formHasChanges, setFormHasChanges] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<CommunityInitiativeResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mutatingInitiativeId, setMutatingInitiativeId] = useState<number | null>(null);
  const [viewedInitiative, setViewedInitiative] =
    useState<CommunityInitiativeResponse | null>(null);
  const [viewingInitiativeId, setViewingInitiativeId] = useState<number | null>(null);
  const [toast, setToast] =
    useState<{ message: string; variant: "success" | "error" } | null>(null);
  const publishedFilter =
    publicationFilter === "" ? undefined : publicationFilter === "published";

  const handleFormDirtyChange = useCallback(
    (hasChanges: boolean) => {
      setFormHasChanges(hasChanges);
      onUnsavedChangesChange(hasChanges);
    },
    [onUnsavedChangesChange],
  );

  function refreshInitiatives() {
    setIsLoading(true);
    setLoadError(null);
    setRefreshKey((current) => current + 1);
  }

  function openInitiativeForm(initiative: CommunityInitiativeResponse | null) {
    if (
      isFormOpen
      && formHasChanges
      && !window.confirm("Discard your unsaved initiative changes?")
    ) {
      return;
    }
    setEditingInitiative(initiative);
    setIsFormOpen(true);
    setViewedInitiative(null);
    setFormHasChanges(false);
    onUnsavedChangesChange(false);
  }

  useEffect(() => {
    let isCurrent = true;
    const query: AdminCommunityInitiativeQuery = {
      search,
      category,
      status,
      published: publishedFilter,
      page: page - 1,
      size: pageSize,
    };

    getAdminInitiatives(authorization, query)
      .then((response) => {
        if (
          !Array.isArray(response.content)
          || typeof response.totalElements !== "number"
          || typeof response.totalPages !== "number"
        ) {
          throw new Error("The initiative service returned an unexpected response.");
        }
        if (!isCurrent) return;
        setInitiatives(response.content);
        setTotalInitiatives(response.totalElements);
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setLoadError(getErrorMessage(error, "Initiatives could not be loaded.", onLogout));
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [authorization, category, onLogout, page, publishedFilter, refreshKey, search, status]);

  useEffect(() => {
    let isCurrent = true;
    getAdminEvents(authorization, {
      search: eventSearch,
      status: "",
      published: undefined,
      page: 0,
      size: 100,
    })
      .then((response) => {
        if (!Array.isArray(response.content)) {
          throw new Error("The event service returned an unexpected response.");
        }
        if (isCurrent) {
          setEvents((current) => {
            const eventsById = new Map(current.map((event) => [event.id, event]));
            response.content.forEach((event) => eventsById.set(event.id, event));
            return [...eventsById.values()];
          });
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setEventsError(getErrorMessage(error, "Events could not be loaded.", onLogout));
        }
      })
      .finally(() => {
        if (isCurrent) setIsEventsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [authorization, eventSearch, onLogout]);

  async function saveInitiative(request: CommunityInitiativeRequest) {
    setIsSubmitting(true);
    setToast(null);
    try {
      if (editingInitiative) {
        await updateAdminInitiative(authorization, editingInitiative.id, request);
        setToast({ message: "Initiative changes saved.", variant: "success" });
      } else {
        await createAdminInitiative(authorization, request);
        setToast({ message: "Initiative created.", variant: "success" });
        setPage(1);
      }
      setIsFormOpen(false);
      setEditingInitiative(null);
      setViewedInitiative(null);
      setFormHasChanges(false);
      onUnsavedChangesChange(false);
      refreshInitiatives();
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "The initiative could not be saved.", onLogout),
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function changePublication(initiative: CommunityInitiativeResponse) {
    setMutatingInitiativeId(initiative.id);
    setToast(null);
    try {
      if (initiative.published) {
        await unpublishAdminInitiative(authorization, initiative.id);
        setToast({ message: "Initiative unpublished.", variant: "success" });
      } else {
        await publishAdminInitiative(authorization, initiative.id);
        setToast({ message: "Initiative published.", variant: "success" });
      }
      refreshInitiatives();
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "Publication status could not be changed.", onLogout),
        variant: "error",
      });
    } finally {
      setMutatingInitiativeId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setToast(null);
    try {
      await deleteAdminInitiative(authorization, pendingDelete.id);
      setToast({ message: "Initiative deleted.", variant: "success" });
      setPendingDelete(null);
      setViewedInitiative(null);
      setPage(1);
      refreshInitiatives();
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "The initiative could not be deleted.", onLogout),
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  async function viewInitiative(initiative: CommunityInitiativeResponse) {
    setViewingInitiativeId(initiative.id);
    setToast(null);
    try {
      setViewedInitiative(await getAdminInitiative(authorization, initiative.id));
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "Initiative details could not be loaded.", onLogout),
        variant: "error",
      });
    } finally {
      setViewingInitiativeId(null);
    }
  }

  const columns: AdminDataTableColumn<CommunityInitiativeResponse>[] = [
    {
      id: "title",
      header: "Initiative",
      render: (initiative) => (
        <div className="min-w-40">
          <p className="font-semibold text-slate-900">{initiative.title}</p>
          {initiative.shortDescription && (
            <p className="mt-1 max-w-xs truncate text-xs text-slate-500">
              {initiative.shortDescription}
            </p>
          )}
        </div>
      ),
    },
    { id: "category", header: "Category", render: (initiative) => initiative.category || "—" },
    { id: "start", header: "Start date", render: (initiative) => formatDate(initiative.startDate) },
    {
      id: "status",
      header: "Status",
      render: (initiative) => (
        <StatusBadge label={initiative.status} variant={statusVariant(initiative.status)} />
      ),
    },
    {
      id: "published",
      header: "Published",
      render: (initiative) => (
        <StatusBadge
          label={initiative.published ? "Published" : "Unpublished"}
          variant={initiative.published ? "success" : "warning"}
        />
      ),
    },
    {
      id: "updated",
      header: "Last updated",
      render: (initiative) => formatDateTime(initiative.updatedAt),
    },
    {
      id: "actions",
      header: "Actions",
      className: "whitespace-nowrap",
      render: (initiative) => (
        <div className="flex items-center gap-1">
          <button
            aria-label={`View ${initiative.title}`}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
            disabled={viewingInitiativeId === initiative.id}
            onClick={() => void viewInitiative(initiative)}
            title="View initiative"
            type="button"
          >
            <span className="sr-only">View</span>
            <Eye size={16} />
          </button>
          <button
            aria-label={`Edit ${initiative.title}`}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            onClick={() => {
              openInitiativeForm(initiative);
            }}
            title="Edit initiative"
            type="button"
          >
            <Pencil size={16} />
          </button>
          <button
            aria-label={`${initiative.published ? "Unpublish" : "Publish"} ${initiative.title}`}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
            disabled={mutatingInitiativeId === initiative.id}
            onClick={() => void changePublication(initiative)}
            title={initiative.published ? "Unpublish initiative" : "Publish initiative"}
            type="button"
          >
            {initiative.published ? <Undo2 size={16} /> : <Send size={16} />}
          </button>
          <button
            aria-label={`Delete ${initiative.title}`}
            className="rounded-md p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
            disabled={mutatingInitiativeId === initiative.id}
            onClick={() => setPendingDelete(initiative)}
            title="Delete initiative"
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
        title="Community Initiatives"
        description="Manage community programmes independently of their related events."
        actions={
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-[#7b1e2b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#641925]"
            onClick={() => {
              openInitiativeForm(null);
            }}
            type="button"
          >
            <Plus size={16} />
            Create initiative
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
        <InitiativeForm
          key={editingInitiative?.id ?? "new-initiative"}
          initiative={editingInitiative}
          events={events}
          eventSearch={eventSearch}
          eventsError={eventsError}
          isEventsLoading={isEventsLoading}
          isSubmitting={isSubmitting}
          onCancel={() => {
            if (isSubmitting) return;
            setIsFormOpen(false);
            setEditingInitiative(null);
            setFormHasChanges(false);
            onUnsavedChangesChange(false);
          }}
          onDirtyChange={handleFormDirtyChange}
          onEventSearchChange={(nextSearch) => {
            setIsEventsLoading(true);
            setEventsError(null);
            setEventSearch(nextSearch);
          }}
          onSubmit={(request) => void saveInitiative(request)}
        />
      )}

      <section
        aria-label="Initiative filters"
        className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <AdminSearch
          id="initiative-search"
          label="Search"
          placeholder="Search initiatives"
          value={search}
          onChange={(value) => {
            setIsLoading(true);
            setLoadError(null);
            setSearch(value);
            setPage(1);
          }}
        />
        <AdminSearch
          id="initiative-category-filter"
          label="Category filter"
          placeholder="Match a category"
          value={category}
          onChange={(value) => {
            setIsLoading(true);
            setLoadError(null);
            setCategory(value);
            setPage(1);
          }}
        />
        <AdminFilter
          id="initiative-status-filter"
          label="Status"
          value={status}
          onChange={(value) => {
            if (value === "" || isInitiativeStatus(value)) {
              setIsLoading(true);
              setLoadError(null);
              setStatus(value);
              setPage(1);
            }
          }}
          options={[
            { label: "All statuses", value: "" },
            { label: "Planned", value: "PLANNED" },
            { label: "Active", value: "ACTIVE" },
            { label: "Completed", value: "COMPLETED" },
          ]}
        />
        <AdminFilter
          id="initiative-publication-filter"
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
        emptyMessage="No initiatives match these filters."
        error={loadError}
        getRowKey={(initiative) => initiative.id}
        isLoading={isLoading}
        loadingMessage="Loading initiatives..."
        rows={initiatives}
      />

      <AdminPagination
        page={page}
        pageSize={pageSize}
        totalItems={totalInitiatives}
        onPageChange={(nextPage) => {
          setIsLoading(true);
          setLoadError(null);
          setPage(nextPage);
        }}
      />

      {viewedInitiative && (
        <section
          aria-labelledby="initiative-details-heading"
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900" id="initiative-details-heading">
                {viewedInitiative.title}
              </h3>
              <p className="mt-1 text-sm text-slate-500">Initiative details</p>
            </div>
            <button
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => setViewedInitiative(null)}
              type="button"
            >
              Close
            </button>
          </div>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            <div>
              <dt className="font-medium text-slate-500">Description</dt>
              <dd className="mt-1 whitespace-pre-wrap text-slate-800">
                {viewedInitiative.description}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Dates</dt>
              <dd className="mt-1 text-slate-800">
                {formatDate(viewedInitiative.startDate)}
                {viewedInitiative.endDate ? ` – ${formatDate(viewedInitiative.endDate)}` : ""}
              </dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Location</dt>
              <dd className="mt-1 text-slate-800">{viewedInitiative.location || "—"}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Related events</dt>
              <dd className="mt-1 text-slate-800">
                {viewedInitiative.relatedEvents.map((event) => event.title).join(", ") || "—"}
              </dd>
            </div>
          </dl>
        </section>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete initiative?"
        description={
          pendingDelete
            ? `“${pendingDelete.title}” will be hidden from management and public listings. Related event records will remain unchanged.`
            : "This initiative will be hidden from public listings."
        }
        confirmLabel="Delete initiative"
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
