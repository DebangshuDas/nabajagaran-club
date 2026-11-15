import axios from "axios";
import {
  Eye,
  Pencil,
  Plus,
  RefreshCw,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
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
import { AnnouncementContent } from "../../components/ui/AnnouncementContent";
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncementById,
  getAnnouncements,
  publishAnnouncement,
  unpublishAnnouncement,
  updateAnnouncement,
} from "../../services/adminService";
import type {
  AdminAnnouncementQuery,
  AnnouncementCreateRequest,
  AnnouncementResponse,
  AnnouncementUpdateRequest,
} from "../../types/api";
import { AnnouncementForm } from "./AnnouncementForm";

type AdminOutletContext = {
  authorization: string;
  onLogout: () => void;
};

type BackendError = {
  message?: string;
};

type AnnouncementSort = AdminAnnouncementQuery["sort"];

const pageSize = 10;
const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateTimeFormatter.format(date);
}

function publicationStatus(announcement: AnnouncementResponse) {
  if (announcement.published) return "Published";
  return announcement.publishedAt ? "Unpublished" : "Draft";
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

export function AnnouncementsManagementPage() {
  const { authorization, onLogout } = useOutletContext<AdminOutletContext>();
  const [announcements, setAnnouncements] = useState<AnnouncementResponse[]>([]);
  const [totalAnnouncements, setTotalAnnouncements] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [publicationFilter, setPublicationFilter] = useState("");
  const [audience, setAudience] = useState("");
  const [sort, setSort] = useState<AnnouncementSort>("createdAt,desc");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<AnnouncementResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<AnnouncementResponse | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mutatingAnnouncementId, setMutatingAnnouncementId] = useState<number | null>(null);
  const [viewedAnnouncement, setViewedAnnouncement] = useState<AnnouncementResponse | null>(null);
  const [viewingAnnouncementId, setViewingAnnouncementId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; variant: "success" | "error" } | null>(null);

  const publishedFilter =
    publicationFilter === "" ? undefined : publicationFilter === "published";

  function refreshAnnouncements() {
    setIsLoading(true);
    setLoadError(null);
    setRefreshKey((current) => current + 1);
  }

  useEffect(() => {
    let isCurrent = true;
    const query: AdminAnnouncementQuery = {
      search,
      published: publishedFilter,
      audience,
      page: page - 1,
      size: pageSize,
      sort,
    };

    getAnnouncements(authorization, query)
      .then((response) => {
        if (
          !Array.isArray(response.content)
          || typeof response.totalElements !== "number"
          || typeof response.totalPages !== "number"
        ) {
          throw new Error("The announcement service returned an unexpected response.");
        }
        if (!isCurrent) return;
        setAnnouncements(response.content);
        setTotalAnnouncements(response.totalElements);
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setLoadError(getErrorMessage(error, "Announcements could not be loaded.", onLogout));
        }
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [authorization, audience, onLogout, page, publishedFilter, refreshKey, search, sort]);

  async function saveAnnouncement(
    request: AnnouncementCreateRequest | AnnouncementUpdateRequest,
  ) {
    setIsSubmitting(true);
    setToast(null);
    try {
      if (editingAnnouncement) {
        const updateRequest: AnnouncementUpdateRequest = {
          title: request.title,
          content: request.content,
          audience: request.audience,
        };
        await updateAnnouncement(authorization, editingAnnouncement.id, updateRequest);
        setToast({ message: "Announcement changes saved.", variant: "success" });
      } else if ("publishImmediately" in request) {
        await createAnnouncement(authorization, request);
        setToast({
          message: request.publishImmediately ? "Announcement published." : "Announcement saved as draft.",
          variant: "success",
        });
        setPage(1);
      } else {
        throw new Error("Publication mode is required when creating an announcement.");
      }
      setIsFormOpen(false);
      setEditingAnnouncement(null);
      setViewedAnnouncement(null);
      refreshAnnouncements();
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "The announcement could not be saved.", onLogout),
        variant: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function openEditor(announcement: AnnouncementResponse) {
    setToast(null);
    try {
      const latestAnnouncement = await getAnnouncementById(authorization, announcement.id);
      setEditingAnnouncement(latestAnnouncement);
      setIsFormOpen(true);
      setViewedAnnouncement(null);
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "Announcement details could not be loaded.", onLogout),
        variant: "error",
      });
    }
  }

  async function changePublication(announcement: AnnouncementResponse) {
    setMutatingAnnouncementId(announcement.id);
    setToast(null);
    try {
      if (announcement.published) {
        await unpublishAnnouncement(authorization, announcement.id);
        setToast({ message: "Announcement unpublished.", variant: "success" });
      } else {
        await publishAnnouncement(authorization, announcement.id);
        setToast({ message: "Announcement published.", variant: "success" });
      }
      refreshAnnouncements();
      if (viewedAnnouncement?.id === announcement.id) setViewedAnnouncement(null);
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "Publication status could not be changed.", onLogout),
        variant: "error",
      });
    } finally {
      setMutatingAnnouncementId(null);
    }
  }

  async function confirmDelete() {
    if (!pendingDelete) return;
    setIsDeleting(true);
    setToast(null);
    try {
      await deleteAnnouncement(authorization, pendingDelete.id);
      setToast({ message: "Announcement deleted.", variant: "success" });
      setPendingDelete(null);
      setViewedAnnouncement(null);
      setPage(1);
      refreshAnnouncements();
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "The announcement could not be deleted.", onLogout),
        variant: "error",
      });
    } finally {
      setIsDeleting(false);
    }
  }

  async function viewAnnouncement(announcement: AnnouncementResponse) {
    setViewingAnnouncementId(announcement.id);
    setToast(null);
    try {
      setViewedAnnouncement(await getAnnouncementById(authorization, announcement.id));
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "Announcement details could not be loaded.", onLogout),
        variant: "error",
      });
    } finally {
      setViewingAnnouncementId(null);
    }
  }

  const columns: AdminDataTableColumn<AnnouncementResponse>[] = [
    {
      id: "title",
      header: "Announcement",
      render: (announcement) => (
        <div className="min-w-40">
          <p className="font-semibold text-slate-900">{announcement.title}</p>
          <p className="mt-1 max-w-xs truncate text-xs text-slate-500">{announcement.content}</p>
        </div>
      ),
    },
    {
      id: "publication",
      header: "Publication",
      render: (announcement) => (
        <StatusBadge
        label={publicationStatus(announcement)}
          variant={announcement.published ? "success" : "warning"}
        />
      ),
    },
    { id: "audience", header: "Audience", render: (announcement) => announcement.audience || "—" },
    { id: "created", header: "Created", render: (announcement) => formatDateTime(announcement.createdAt) },
    { id: "published", header: "Published date", render: (announcement) => formatDateTime(announcement.publishedAt) },
    { id: "updated", header: "Last updated", render: (announcement) => formatDateTime(announcement.updatedAt) },
    {
      id: "actions",
      header: "Actions",
      className: "whitespace-nowrap",
      render: (announcement) => (
        <div className="flex items-center gap-1">
          <button
            aria-label={`Preview ${announcement.title}`}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
            disabled={viewingAnnouncementId === announcement.id}
            onClick={() => void viewAnnouncement(announcement)}
            title="Preview announcement"
            type="button"
          >
            <Eye size={16} />
          </button>
          <button
            aria-label={`Edit ${announcement.title}`}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            onClick={() => void openEditor(announcement)}
            title="Edit announcement"
            type="button"
          >
            <Pencil size={16} />
          </button>
          <button
            aria-label={`${announcement.published ? "Unpublish" : "Publish"} ${announcement.title}`}
            className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
            disabled={mutatingAnnouncementId === announcement.id}
            onClick={() => void changePublication(announcement)}
            title={announcement.published ? "Unpublish announcement" : "Publish announcement"}
            type="button"
          >
            {announcement.published ? <Undo2 size={16} /> : <Send size={16} />}
          </button>
          <button
            aria-label={`Delete ${announcement.title}`}
            className="rounded-md p-2 text-red-600 hover:bg-red-50 disabled:opacity-50"
            disabled={mutatingAnnouncementId === announcement.id}
            onClick={() => setPendingDelete(announcement)}
            title="Delete announcement"
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
        title="Announcements Management"
        description="Write community updates, preview them, and manage publication from one place."
        actions={
          <>
            <button
              aria-label="Refresh announcements"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              disabled={isLoading}
              onClick={refreshAnnouncements}
              type="button"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
            <button
              className="inline-flex items-center gap-2 rounded-lg bg-[#7b1e2b] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#641925]"
              onClick={() => {
                setEditingAnnouncement(null);
                setIsFormOpen(true);
                setViewedAnnouncement(null);
              }}
              type="button"
            >
              <Plus size={16} />
              Create announcement
            </button>
          </>
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
        <AnnouncementForm
          announcement={editingAnnouncement}
          isSubmitting={isSubmitting}
          key={editingAnnouncement?.id ?? "new-announcement"}
          onCancel={() => {
            if (isSubmitting) return;
            setIsFormOpen(false);
            setEditingAnnouncement(null);
          }}
          onSubmit={(request) => void saveAnnouncement(request)}
        />
      )}

      <section
        aria-label="Announcement filters"
        className="grid gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <AdminSearch
          id="announcement-search"
          label="Search title and content"
          placeholder="Search announcements"
          value={search}
          onChange={(value) => {
            setIsLoading(true);
            setLoadError(null);
            setSearch(value);
            setPage(1);
          }}
        />
        <AdminFilter
          id="announcement-publication-filter"
          label="Publication"
          value={publicationFilter}
          onChange={(value) => {
            setIsLoading(true);
            setLoadError(null);
            setPublicationFilter(value);
            setPage(1);
          }}
          options={[
            { label: "All statuses", value: "" },
            { label: "Published", value: "published" },
            { label: "Draft", value: "draft" },
          ]}
        />
        <label className="block text-sm font-medium text-slate-700" htmlFor="announcement-audience-filter">
          Audience
          <input
            className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#7b1e2b] focus:ring-2 focus:ring-[#7b1e2b]/10"
            id="announcement-audience-filter"
            onChange={(event) => {
              setIsLoading(true);
              setLoadError(null);
              setAudience(event.target.value);
              setPage(1);
            }}
            placeholder="Filter by audience"
            value={audience}
          />
        </label>
        <AdminFilter
          id="announcement-sort"
          label="Sort by"
          value={sort}
          onChange={(value) => {
            if (
              value === "createdAt,desc"
              || value === "createdAt,asc"
              || value === "publishedAt,desc"
              || value === "publishedAt,asc"
            ) {
              setSort(value);
              setPage(1);
            }
          }}
          options={[
            { label: "Created date (newest)", value: "createdAt,desc" },
            { label: "Created date (oldest)", value: "createdAt,asc" },
            { label: "Published date (newest)", value: "publishedAt,desc" },
            { label: "Published date (oldest)", value: "publishedAt,asc" },
          ]}
        />
      </section>

      {isLoading ? (
        <div aria-busy="true" aria-label="Loading announcements" className="space-y-2 rounded-xl border border-slate-200 bg-white p-4">
          {[0, 1, 2, 3].map((row) => (
            <div className="flex animate-pulse items-center gap-4 border-b border-slate-100 py-4 last:border-0" key={row}>
              <div className="h-10 flex-1 rounded bg-slate-100" />
              <div className="hidden h-8 w-24 rounded bg-slate-100 sm:block" />
              <div className="h-8 w-28 rounded bg-slate-100" />
            </div>
          ))}
        </div>
      ) : (
        <AdminDataTable
          columns={columns}
          emptyMessage="No announcements match these filters."
          error={loadError}
          getRowKey={(announcement) => announcement.id}
          rows={announcements}
        />
      )}

      <AdminPagination
        page={page}
        pageSize={pageSize}
        totalItems={totalAnnouncements}
        onPageChange={(nextPage) => {
          setIsLoading(true);
          setLoadError(null);
          setPage(nextPage);
        }}
      />

      {viewedAnnouncement && (
        <section
          aria-labelledby="announcement-preview-heading"
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold text-slate-900" id="announcement-preview-heading">
                  {viewedAnnouncement.title}
                </h3>
                <StatusBadge
                  label={
                    viewedAnnouncement.published
                      ? "Published"
                      : viewedAnnouncement.publishedAt
                        ? "Unpublished preview"
                        : "Draft preview"
                  }
                  variant={viewedAnnouncement.published ? "success" : "warning"}
                />
              </div>
              <p className="mt-1 text-sm text-slate-500">
                {viewedAnnouncement.audience || "Public"}
                {" · "}
                {formatDateTime(viewedAnnouncement.publishedAt ?? viewedAnnouncement.createdAt)}
              </p>
            </div>
            <button
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              onClick={() => setViewedAnnouncement(null)}
              type="button"
            >
              Close
            </button>
          </div>
          <AnnouncementContent
            className="space-y-3 border-t border-slate-100 pt-4 text-sm leading-6 text-slate-700"
            content={viewedAnnouncement.content}
          />
        </section>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete announcement?"
        description={
          pendingDelete
            ? `"${pendingDelete.title}" will be hidden from active admin listings and the public site.`
            : "This announcement will be hidden from active listings."
        }
        confirmLabel="Delete announcement"
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
