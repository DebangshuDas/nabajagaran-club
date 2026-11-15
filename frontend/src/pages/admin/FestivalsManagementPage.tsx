import axios from "axios";
import {
  ArrowLeft,
  CalendarDays,
  Pencil,
  Plus,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import {
  AdminDataTable,
  type AdminDataTableColumn,
} from "../../components/admin/AdminDataTable";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminPagination } from "../../components/admin/AdminPagination";
import { AdminSearch } from "../../components/admin/AdminSearch";
import { AdminToast } from "../../components/admin/AdminToast";
import { StatusBadge } from "../../components/admin/StatusBadge";
import {
  createAdminFestival,
  createAdminFestivalEdition,
  deleteAdminFestival,
  deleteAdminFestivalEdition,
  getAdminFestival,
  getAdminFestivalEdition,
  getAdminFestivalEditions,
  getAdminFestivalAssociationOptions,
  getAdminFestivals,
  publishAdminFestival,
  publishAdminFestivalEdition,
  unpublishAdminFestival,
  unpublishAdminFestivalEdition,
  updateAdminFestival,
  updateAdminFestivalEdition,
} from "../../services/adminService";
import type {
  AdminFestivalQuery,
  FestivalAssociationOptionResponse,
  FestivalAssociationType,
  FestivalEditionRequest,
  FestivalEditionResponse,
  FestivalRequest,
  FestivalResponse,
} from "../../types/api";

type AdminOutletContext = {
  authorization: string;
  onLogout: () => void;
  onUnsavedChangesChange: (hasChanges: boolean) => void;
};

type BackendError = { message?: string };
type Toast = { message: string; variant: "success" | "error" };

const pageSize = 10;
const dateFormatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});
const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60";
const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#7b1e2b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#641925] disabled:cursor-wait disabled:opacity-60";
const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#7b1e2b] focus:ring-2 focus:ring-[#7b1e2b]/10";
const labelClass = "block text-sm font-medium text-slate-700";

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

function publishedVariant(published: boolean) {
  return published ? "success" : "neutral";
}

function ErrorNotification({ message }: { message: string }) {
  return <AdminToast message={message} variant="error" />;
}

function BackLink({
  to,
  children,
  hasUnsavedChanges = false,
}: {
  to: string;
  children: ReactNode;
  hasUnsavedChanges?: boolean;
}) {
  return (
    <Link
      className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#7b1e2b]"
      onClick={(event) => {
        if (
          hasUnsavedChanges
          && !window.confirm("Leave this page and discard unsaved changes?")
        ) {
          event.preventDefault();
        }
      }}
      to={to}
    >
      <ArrowLeft size={16} />
      {children}
    </Link>
  );
}

export function FestivalsManagementPage() {
  const { authorization, onLogout } = useOutletContext<AdminOutletContext>();
  const [festivals, setFestivals] = useState<FestivalResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [publication, setPublication] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mutatingId, setMutatingId] = useState<number | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const publishedFilter = publication === "" ? undefined : publication === "published";

  useEffect(() => {
    let active = true;
    const query: AdminFestivalQuery = {
      search,
      published: publishedFilter,
      page: page - 1,
      size: pageSize,
    };
    getAdminFestivals(authorization, query)
      .then((response) => {
        if (!Array.isArray(response.content) || typeof response.totalElements !== "number") {
          throw new Error("The festival service returned an unexpected response.");
        }
        if (!active) return;
        setFestivals(response.content);
        setTotal(response.totalElements);
        setLoadError(null);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(getErrorMessage(error, "Festivals could not be loaded.", onLogout));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authorization, onLogout, page, publishedFilter, refreshKey, search]);

  async function changePublication(festival: FestivalResponse) {
    setMutatingId(festival.id);
    setToast(null);
    try {
      if (festival.published) {
        await unpublishAdminFestival(authorization, festival.id);
        setToast({ message: `${festival.name} unpublished.`, variant: "success" });
      } else {
        await publishAdminFestival(authorization, festival.id);
        setToast({ message: `${festival.name} published.`, variant: "success" });
      }
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "Publication status could not be changed.", onLogout),
        variant: "error",
      });
    } finally {
      setMutatingId(null);
    }
  }

  async function removeFestival(festival: FestivalResponse) {
    if (!window.confirm(`Delete ${festival.name}? Festival profiles with edition history cannot be deleted.`)) {
      return;
    }
    setMutatingId(festival.id);
    setToast(null);
    try {
      await deleteAdminFestival(authorization, festival.id);
      setToast({ message: `${festival.name} deleted.`, variant: "success" });
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setToast({
        message: getErrorMessage(error, "The festival could not be deleted.", onLogout),
        variant: "error",
      });
    } finally {
      setMutatingId(null);
    }
  }

  const columns: AdminDataTableColumn<FestivalResponse>[] = [
      {
        id: "festival",
        header: "Festival",
        render: (festival) => (
          <div>
            <Link
              className="font-semibold text-slate-900 hover:text-[#7b1e2b]"
              to={`/admin/festivals/${festival.id}`}
            >
              {festival.name}
            </Link>
            <p className="mt-1 text-xs text-slate-500">/{festival.slug}</p>
          </div>
        ),
      },
      {
        id: "description",
        header: "Description",
        render: (festival) => (
          <span className="line-clamp-2 max-w-xs text-slate-600">
            {festival.description || "—"}
          </span>
        ),
      },
      {
        id: "publication",
        header: "Publication",
        render: (festival) => (
          <StatusBadge label={festival.published ? "Published" : "Draft"} variant={publishedVariant(festival.published)} />
        ),
      },
      {
        id: "updated",
        header: "Last updated",
        render: (festival) => formatDateTime(festival.updatedAt),
      },
      {
        id: "actions",
        header: "Actions",
        className: "whitespace-nowrap",
        render: (festival) => (
          <div className="flex items-center gap-1">
            <Link
              aria-label={`Edit ${festival.name}`}
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-[#7b1e2b]"
              title="Edit festival"
              to={`/admin/festivals/${festival.id}`}
            >
              <Pencil size={16} />
            </Link>
            <Link
              aria-label={`Manage ${festival.name} editions`}
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-[#7b1e2b]"
              title="Manage editions"
              to={`/admin/festivals/${festival.id}/editions`}
            >
              <CalendarDays size={16} />
            </Link>
            <button
              aria-label={festival.published ? `Unpublish ${festival.name}` : `Publish ${festival.name}`}
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-[#7b1e2b] disabled:opacity-50"
              disabled={mutatingId === festival.id}
              onClick={() => void changePublication(festival)}
              title={festival.published ? "Unpublish" : "Publish"}
              type="button"
            >
              {festival.published ? <Undo2 size={16} /> : <Send size={16} />}
            </button>
            <button
              aria-label={`Delete ${festival.name}`}
              className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
              disabled={mutatingId === festival.id}
              onClick={() => void removeFestival(festival)}
              title="Delete festival"
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
        title="Festival management"
        description="Manage reusable festival profiles and their annual editions."
        actions={
          <Link className={primaryButtonClass} to="/admin/festivals/new">
            <Plus size={16} />
            Create festival
          </Link>
        }
      />
      {toast && (
        <AdminToast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />
      )}
      <section className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="min-w-0 flex-1">
            <AdminSearch
              id="festival-search"
              label="Search festivals"
              onChange={(value) => {
                setIsLoading(true);
                setSearch(value);
                setPage(1);
              }}
              value={search}
              placeholder="Search festival profiles"
            />
          </div>
          <label className={labelClass}>
            Publication
            <select
              className={`${inputClass} mt-0 min-w-40`}
              onChange={(event) => {
                setIsLoading(true);
                setPublication(event.target.value);
                setPage(1);
              }}
              value={publication}
            >
              <option value="">All statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </label>
        </div>
      </section>
      {loadError ? (
        <ErrorNotification message={loadError} />
      ) : (
        <AdminDataTable
          columns={columns}
          rows={festivals}
          getRowKey={(festival) => festival.id}
          isLoading={isLoading}
          emptyMessage="No festival profiles found. Create a festival to get started."
          loadingMessage="Loading festivals..."
        />
      )}
      <AdminPagination
        page={page}
        pageSize={pageSize}
        totalItems={total}
        onPageChange={(nextPage) => {
          setIsLoading(true);
          setPage(nextPage);
        }}
      />
    </div>
  );
}

type FestivalForm = {
  name: string;
  slug: string;
  description: string;
  history: string;
  coverImageUrl: string;
  published: boolean;
};

const emptyFestivalForm: FestivalForm = {
  name: "",
  slug: "",
  description: "",
  history: "",
  coverImageUrl: "",
  published: false,
};

function toFestivalForm(festival: FestivalResponse): FestivalForm {
  return {
    name: festival.name,
    slug: festival.slug,
    description: festival.description ?? "",
    history: festival.history ?? "",
    coverImageUrl: festival.coverImageUrl ?? "",
    published: festival.published,
  };
}

function festivalRequest(form: FestivalForm): FestivalRequest {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    description: form.description.trim() || null,
    history: form.history.trim() || null,
    coverImageUrl: form.coverImageUrl.trim() || null,
    published: form.published,
  };
}

function festivalNameFromSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function FestivalEditorPage() {
  const { authorization, onLogout, onUnsavedChangesChange } =
    useOutletContext<AdminOutletContext>();
  const { festivalId = "" } = useParams();
  const navigate = useNavigate();
  const isNewRoute = festivalId === "new";
  const isNumericRoute = /^\d+$/.test(festivalId);
  const isSlugRoute =
    !isNewRoute && !isNumericRoute && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(festivalId);
  const numericId = Number(festivalId);
  const invalidFestivalId =
    !isNewRoute
    && !isSlugRoute
    && (!Number.isSafeInteger(numericId) || numericId <= 0);
  const [resolvedFestivalId, setResolvedFestivalId] = useState<number | null>(
    isSlugRoute || isNewRoute ? null : numericId,
  );
  const [isMissingSlugProfile, setIsMissingSlugProfile] = useState(false);
  const [form, setForm] = useState<FestivalForm>(emptyFestivalForm);
  const [initialForm, setInitialForm] = useState<FestivalForm>(emptyFestivalForm);
  const [isLoading, setIsLoading] = useState(!isNewRoute);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [savedFestival, setSavedFestival] = useState<FestivalResponse | null>(null);
  const isNew = isNewRoute || (isSlugRoute && isMissingSlugProfile);
  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  useEffect(() => {
    if (isNewRoute || invalidFestivalId) return;
    let active = true;
    const festivalPromise = isSlugRoute
      ? getAdminFestivals(authorization, {
          search: festivalId,
          published: undefined,
          page: 0,
          size: 100,
        }).then((response) => {
          const festival = response.content.find((item) => item.slug === festivalId);
          if (!festival) {
            if (active) {
              setResolvedFestivalId(null);
              setIsMissingSlugProfile(true);
              setForm({
                ...emptyFestivalForm,
                name: festivalNameFromSlug(festivalId),
                slug: festivalId,
              });
              setInitialForm(emptyFestivalForm);
            }
            return null;
          }
          return festival;
        })
      : getAdminFestival(authorization, numericId);
    festivalPromise
      .then((festival) => {
        if (!active || !festival) return;
        const nextForm = toFestivalForm(festival);
        setResolvedFestivalId(festival.id);
        setIsMissingSlugProfile(false);
        setForm(nextForm);
        setInitialForm(nextForm);
        setSavedFestival(festival);
      })
      .catch((loadError: unknown) => {
        if (active) setError(getErrorMessage(loadError, "Festival details could not be loaded.", onLogout));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authorization, festivalId, invalidFestivalId, isNewRoute, isSlugRoute, numericId, onLogout]);

  useEffect(() => {
    onUnsavedChangesChange(dirty);
  }, [dirty, onUnsavedChangesChange]);

  useEffect(() => () => onUnsavedChangesChange(false), [onUnsavedChangesChange]);

  useEffect(() => {
    if (!dirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  function cancel() {
    if (dirty && !window.confirm("Discard your unsaved festival changes?")) return;
    onUnsavedChangesChange(false);
    navigate("/admin/festivals");
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setToast(null);
    try {
      const request = festivalRequest(form);
      const festival = isNew
        ? await createAdminFestival(authorization, request)
        : await updateAdminFestival(authorization, resolvedFestivalId ?? numericId, request);
      const nextForm = toFestivalForm(festival);
      setResolvedFestivalId(festival.id);
      setIsMissingSlugProfile(false);
      setForm(nextForm);
      setInitialForm(nextForm);
      setSavedFestival(festival);
      setToast({ message: isNew ? "Festival profile created." : "Festival changes saved.", variant: "success" });
      onUnsavedChangesChange(false);
      if (isNewRoute) navigate(`/admin/festivals/${festival.id}`, { replace: true });
    } catch (saveError) {
      setToast({
        message: getErrorMessage(saveError, "Festival profile could not be saved.", onLogout),
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function setValue<Key extends keyof FestivalForm>(key: Key, value: FestivalForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  if (invalidFestivalId || error) {
    return (
      <div className="space-y-5">
        <BackLink hasUnsavedChanges={dirty} to="/admin/festivals">Festival profiles</BackLink>
        <ErrorNotification message={error ?? "Festival not found."} />
      </div>
    );
  }
  if (isLoading) return <p className="text-sm text-slate-500">Loading festival profile...</p>;

  return (
    <div className="space-y-6">
      <BackLink hasUnsavedChanges={dirty} to="/admin/festivals">Festival profiles</BackLink>
      <AdminPageHeader
        title={
          isSlugRoute
            ? `Manage ${savedFestival?.name ?? festivalNameFromSlug(festivalId)}`
            : isNew
              ? "Create festival"
              : `Edit ${savedFestival?.name ?? "festival"}`
        }
        description={
          isSlugRoute
            ? "Manage this festival profile and its annual editions using the shared festival system."
            : "Festival profiles are reusable across all annual editions."
        }
        actions={
          savedFestival && (
            <Link
              className={buttonClass}
              onClick={(event) => {
                if (
                  dirty
                  && !window.confirm("Leave this page and discard unsaved changes?")
                ) {
                  event.preventDefault();
                }
              }}
              to={`/admin/festivals/${savedFestival.id}/editions`}
            >
              <CalendarDays size={16} />
              Manage editions
            </Link>
          )
        }
      />
      {toast && <AdminToast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
      <form className="space-y-6" onSubmit={(event) => void save(event)}>
        <section className="grid gap-5 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 sm:p-6">
          <label className={labelClass}>
            Festival name *
            <input className={inputClass} maxLength={150} onChange={(event) => setValue("name", event.target.value)} required value={form.name} />
          </label>
          <label className={labelClass}>
            URL slug *
            <input
              className={inputClass}
              maxLength={150}
              onChange={(event) => setValue("slug", event.target.value)}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              required
              title="Use lowercase letters, numbers, and hyphens."
              value={form.slug}
            />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Cover image URL
            <input className={inputClass} maxLength={255} onChange={(event) => setValue("coverImageUrl", event.target.value)} type="url" value={form.coverImageUrl} />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Description
            <textarea className={`${inputClass} min-h-28`} maxLength={20000} onChange={(event) => setValue("description", event.target.value)} value={form.description} />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            History
            <textarea className={`${inputClass} min-h-36`} maxLength={50000} onChange={(event) => setValue("history", event.target.value)} value={form.history} />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
            <input checked={form.published} onChange={(event) => setValue("published", event.target.checked)} type="checkbox" />
            Publish festival profile
          </label>
          {savedFestival && (
            <p className="text-xs text-slate-500 sm:col-span-2">
              Last updated {formatDateTime(savedFestival.updatedAt)}
            </p>
          )}
        </section>
        <div className="flex flex-wrap justify-end gap-3">
          <button className={buttonClass} onClick={cancel} type="button">Cancel</button>
          <button className={primaryButtonClass} disabled={isSaving || !dirty} type="submit">
            {isSaving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

export function FestivalEditionsPage() {
  const { authorization, onLogout } = useOutletContext<AdminOutletContext>();
  const { festivalId = "" } = useParams();
  const numericId = Number(festivalId);
  const invalidFestivalId = !Number.isSafeInteger(numericId) || numericId <= 0;
  const [festival, setFestival] = useState<FestivalResponse | null>(null);
  const [editions, setEditions] = useState<FestivalEditionResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mutatingId, setMutatingId] = useState<number | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  useEffect(() => {
    if (invalidFestivalId) return;
    let active = true;
    Promise.all([
      getAdminFestival(authorization, numericId),
      getAdminFestivalEditions(authorization, numericId, page - 1, pageSize),
    ])
      .then(([festivalResponse, editionResponse]) => {
        if (!active) return;
        setFestival(festivalResponse);
        setEditions(editionResponse.content);
        setTotal(editionResponse.totalElements);
      })
      .catch((loadError: unknown) => {
        if (active) setError(getErrorMessage(loadError, "Festival editions could not be loaded.", onLogout));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authorization, invalidFestivalId, numericId, onLogout, page, refreshKey]);

  async function setEditionPublication(edition: FestivalEditionResponse) {
    setMutatingId(edition.id);
    try {
      if (edition.published) {
        await unpublishAdminFestivalEdition(authorization, numericId, edition.id);
        setToast({ message: `${edition.year} edition unpublished.`, variant: "success" });
      } else {
        await publishAdminFestivalEdition(authorization, numericId, edition.id);
        setToast({ message: `${edition.year} edition published.`, variant: "success" });
      }
      setRefreshKey((current) => current + 1);
    } catch (mutationError) {
      setToast({
        message: getErrorMessage(mutationError, "Edition publication could not be changed.", onLogout),
        variant: "error",
      });
    } finally {
      setMutatingId(null);
    }
  }

  async function removeEdition(edition: FestivalEditionResponse) {
    if (!window.confirm(`Delete the ${edition.year} edition? This preserves it as historical data.`)) return;
    setMutatingId(edition.id);
    try {
      await deleteAdminFestivalEdition(authorization, numericId, edition.id);
      setToast({ message: `${edition.year} edition deleted.`, variant: "success" });
      setRefreshKey((current) => current + 1);
    } catch (mutationError) {
      setToast({
        message: getErrorMessage(mutationError, "The edition could not be deleted.", onLogout),
        variant: "error",
      });
    } finally {
      setMutatingId(null);
    }
  }

  const columns: AdminDataTableColumn<FestivalEditionResponse>[] = [
      {
        id: "edition",
        header: "Edition",
        render: (edition) => (
          <div>
            <Link className="font-semibold text-slate-900 hover:text-[#7b1e2b]" to={`/admin/festivals/${numericId}/editions/${edition.id}`}>
              {edition.year}{edition.theme ? ` · ${edition.theme}` : ""}
            </Link>
            <p className="mt-1 text-xs text-slate-500">{edition.venue || "Venue not set"}</p>
          </div>
        ),
      },
      {
        id: "dates",
        header: "Dates",
        render: (edition) => `${formatDate(edition.startDate)} – ${formatDate(edition.endDate)}`,
      },
      {
        id: "associations",
        header: "Associated content",
        render: (edition) => `${edition.events.length} events · ${edition.galleryImages.length} images · ${edition.sponsors.length} sponsors`,
      },
      {
        id: "publication",
        header: "Publication",
        render: (edition) => (
          <StatusBadge label={edition.published ? "Published" : "Draft"} variant={publishedVariant(edition.published)} />
        ),
      },
      {
        id: "updated",
        header: "Last updated",
        render: (edition) => formatDateTime(edition.updatedAt),
      },
      {
        id: "actions",
        header: "Actions",
        className: "whitespace-nowrap",
        render: (edition) => (
          <div className="flex items-center gap-1">
            <Link
              aria-label={`Edit ${edition.year} edition`}
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-[#7b1e2b]"
              to={`/admin/festivals/${numericId}/editions/${edition.id}`}
            >
              <Pencil size={16} />
            </Link>
            <button
              aria-label={edition.published ? "Unpublish edition" : "Publish edition"}
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-[#7b1e2b] disabled:opacity-50"
              disabled={mutatingId === edition.id}
              onClick={() => void setEditionPublication(edition)}
              type="button"
            >
              {edition.published ? <Undo2 size={16} /> : <Send size={16} />}
            </button>
            <button
              aria-label={`Delete ${edition.year} edition`}
              className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
              disabled={mutatingId === edition.id}
              onClick={() => void removeEdition(edition)}
              type="button"
            >
              <Trash2 size={16} />
            </button>
          </div>
        ),
      },
    ];

  if (invalidFestivalId || error) {
    return (
      <div className="space-y-5">
        <BackLink to="/admin/festivals">Festival profiles</BackLink>
        <ErrorNotification message={error ?? "Festival not found."} />
      </div>
    );
  }
  if (isLoading) return <p className="text-sm text-slate-500">Loading festival editions...</p>;

  return (
    <div className="space-y-6">
      <BackLink to={`/admin/festivals/${numericId}`}>Edit festival profile</BackLink>
      <AdminPageHeader
        title={`${festival?.name ?? "Festival"} editions`}
        description="Create and manage annual editions with schedules, gallery images, and sponsors."
        actions={
          <Link className={primaryButtonClass} to={`/admin/festivals/${numericId}/editions/new`}>
            <Plus size={16} />
            Add edition
          </Link>
        }
      />
      {toast && <AdminToast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
      <AdminDataTable
        columns={columns}
        rows={editions}
        getRowKey={(edition) => edition.id}
        isLoading={isLoading}
        emptyMessage="No editions have been created for this festival."
        loadingMessage="Loading editions..."
      />
      <AdminPagination
        page={page}
        pageSize={pageSize}
        totalItems={total}
        onPageChange={(nextPage) => {
          setIsLoading(true);
          setPage(nextPage);
        }}
      />
    </div>
  );
}

type EditionForm = {
  year: string;
  theme: string;
  description: string;
  featuredHighlights: string;
  startDate: string;
  endDate: string;
  venue: string;
  address: string;
  published: boolean;
  eventIds: number[];
  galleryImageIds: number[];
  sponsorIds: number[];
};

const emptyEditionForm: EditionForm = {
  year: "",
  theme: "",
  description: "",
  featuredHighlights: "",
  startDate: "",
  endDate: "",
  venue: "",
  address: "",
  published: false,
  eventIds: [],
  galleryImageIds: [],
  sponsorIds: [],
};

function toEditionForm(edition: FestivalEditionResponse): EditionForm {
  return {
    year: String(edition.year),
    theme: edition.theme ?? "",
    description: edition.description ?? "",
    featuredHighlights: edition.featuredHighlights ?? "",
    startDate: edition.startDate ?? "",
    endDate: edition.endDate ?? "",
    venue: edition.venue ?? "",
    address: edition.address ?? "",
    published: edition.published,
    eventIds: edition.events.map((item) => item.id),
    galleryImageIds: edition.galleryImages.map((item) => item.id),
    sponsorIds: edition.sponsors.map((item) => item.id),
  };
}

function editionRequest(form: EditionForm): FestivalEditionRequest {
  return {
    year: Number(form.year),
    theme: form.theme.trim() || null,
    description: form.description.trim() || null,
    featuredHighlights: form.featuredHighlights.trim() || null,
    startDate: form.startDate || null,
    endDate: form.endDate || null,
    venue: form.venue.trim() || null,
    address: form.address.trim() || null,
    published: form.published,
    eventIds: form.eventIds,
    galleryImageIds: form.galleryImageIds,
    sponsorIds: form.sponsorIds,
  };
}

const associationGroups: {
  type: FestivalAssociationType;
  label: string;
  field: "eventIds" | "galleryImageIds" | "sponsorIds";
}[] = [
  { type: "EVENT", label: "Existing events", field: "eventIds" },
  { type: "GALLERY_IMAGE", label: "Gallery images", field: "galleryImageIds" },
  { type: "SPONSOR", label: "Sponsors", field: "sponsorIds" },
];

export function FestivalEditionEditorPage() {
  const { authorization, onLogout, onUnsavedChangesChange } =
    useOutletContext<AdminOutletContext>();
  const { festivalId = "", editionId = "" } = useParams();
  const navigate = useNavigate();
  const numericFestivalId = Number(festivalId);
  const isNew = editionId === "new";
  const numericEditionId = Number(editionId);
  const invalidEditionRoute =
    !Number.isSafeInteger(numericFestivalId)
    || numericFestivalId <= 0
    || (!isNew && (!Number.isSafeInteger(numericEditionId) || numericEditionId <= 0));
  const [festival, setFestival] = useState<FestivalResponse | null>(null);
  const [form, setForm] = useState<EditionForm>(emptyEditionForm);
  const [initialForm, setInitialForm] = useState<EditionForm>(emptyEditionForm);
  const [options, setOptions] = useState<Record<FestivalAssociationType, FestivalAssociationOptionResponse[]>>({
    EVENT: [],
    GALLERY_IMAGE: [],
    SPONSOR: [],
  });
  const [searches, setSearches] = useState<Record<FestivalAssociationType, string>>({
    EVENT: "",
    GALLERY_IMAGE: "",
    SPONSOR: "",
  });
  const [optionsError, setOptionsError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  useEffect(() => {
    if (invalidEditionRoute) return;
    let active = true;
    const editionPromise = isNew
      ? Promise.resolve(null)
      : getAdminFestivalEdition(authorization, numericFestivalId, numericEditionId);
    Promise.all([getAdminFestival(authorization, numericFestivalId), editionPromise])
      .then(([festivalResponse, edition]) => {
        if (!active) return;
        setFestival(festivalResponse);
        if (edition) {
          const nextForm = toEditionForm(edition);
          setForm(nextForm);
          setInitialForm(nextForm);
          setUpdatedAt(edition.updatedAt);
        } else {
          setForm(emptyEditionForm);
          setInitialForm(emptyEditionForm);
          setUpdatedAt(null);
        }
      })
      .catch((loadError: unknown) => {
        if (active) setError(getErrorMessage(loadError, "Festival edition could not be loaded.", onLogout));
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authorization, editionId, invalidEditionRoute, isNew, numericEditionId, numericFestivalId, onLogout]);

  useEffect(() => {
    let active = true;
    const timers = associationGroups.map(({ type }) => {
      const timer = window.setTimeout(() => {
        getAdminFestivalAssociationOptions(authorization, type, searches[type])
          .then((response) => {
            if (active) {
              setOptions((current) => ({ ...current, [type]: response.content }));
              setOptionsError(null);
            }
          })
          .catch((loadError: unknown) => {
            if (active) {
              setOptionsError(getErrorMessage(loadError, "Associated content could not be loaded.", onLogout));
            }
          });
      }, searches[type] ? 250 : 0);
      return timer;
    });
    return () => {
      active = false;
      timers.forEach(window.clearTimeout);
    };
  }, [authorization, onLogout, searches]);

  useEffect(() => {
    onUnsavedChangesChange(dirty);
  }, [dirty, onUnsavedChangesChange]);

  useEffect(() => () => onUnsavedChangesChange(false), [onUnsavedChangesChange]);

  useEffect(() => {
    if (!dirty) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [dirty]);

  function cancel() {
    if (dirty && !window.confirm("Discard your unsaved edition changes?")) return;
    onUnsavedChangesChange(false);
    navigate(`/admin/festivals/${numericFestivalId}/editions`);
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setToast(null);
    try {
      const request = editionRequest(form);
      const edition = isNew
        ? await createAdminFestivalEdition(authorization, numericFestivalId, request)
        : await updateAdminFestivalEdition(
            authorization,
            numericFestivalId,
            numericEditionId,
            request,
          );
      const nextForm = toEditionForm(edition);
      setForm(nextForm);
      setInitialForm(nextForm);
      setUpdatedAt(edition.updatedAt);
      setToast({ message: isNew ? "Festival edition created." : "Edition changes saved.", variant: "success" });
      onUnsavedChangesChange(false);
      if (isNew) {
        navigate(`/admin/festivals/${numericFestivalId}/editions/${edition.id}`, { replace: true });
      }
    } catch (saveError) {
      setToast({
        message: getErrorMessage(saveError, "Festival edition could not be saved.", onLogout),
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  function setValue<Key extends keyof EditionForm>(key: Key, value: EditionForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleAssociation(
    field: "eventIds" | "galleryImageIds" | "sponsorIds",
    id: number,
  ) {
    setForm((current) => ({
      ...current,
      [field]: current[field].includes(id)
        ? current[field].filter((selectedId) => selectedId !== id)
        : [...current[field], id],
    }));
  }

  if (invalidEditionRoute || error) {
    return (
      <div className="space-y-5">
        <BackLink to={`/admin/festivals/${numericFestivalId}/editions`}>Festival editions</BackLink>
        <ErrorNotification message={error ?? "Festival or edition not found."} />
      </div>
    );
  }
  if (isLoading) return <p className="text-sm text-slate-500">Loading festival edition...</p>;

  return (
    <div className="space-y-6">
      <BackLink hasUnsavedChanges={dirty} to={`/admin/festivals/${numericFestivalId}/editions`}>
        {festival?.name ?? "Festival"} editions
      </BackLink>
      <AdminPageHeader
        title={isNew ? "Create festival edition" : `Edit ${form.year || "festival"} edition`}
        description="Connect existing events, gallery images, and sponsors; the records remain independently managed."
      />
      {toast && <AdminToast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
      {optionsError && <AdminToast message={optionsError} variant="error" />}
      <form className="space-y-6" onSubmit={(event) => void save(event)}>
        <section className="grid gap-5 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 sm:p-6">
          <label className={labelClass}>
            Edition year *
            <input
              className={inputClass}
              inputMode="numeric"
              max={9999}
              min={1}
              onChange={(event) => setValue("year", event.target.value)}
              required
              type="number"
              value={form.year}
            />
          </label>
          <label className={labelClass}>
            Theme
            <input className={inputClass} maxLength={200} onChange={(event) => setValue("theme", event.target.value)} value={form.theme} />
          </label>
          <label className={labelClass}>
            Start date
            <input className={inputClass} onChange={(event) => setValue("startDate", event.target.value)} type="date" value={form.startDate} />
          </label>
          <label className={labelClass}>
            End date
            <input className={inputClass} onChange={(event) => setValue("endDate", event.target.value)} type="date" value={form.endDate} />
          </label>
          <label className={labelClass}>
            Venue
            <input className={inputClass} maxLength={255} onChange={(event) => setValue("venue", event.target.value)} value={form.venue} />
          </label>
          <label className={labelClass}>
            Address
            <input className={inputClass} maxLength={255} onChange={(event) => setValue("address", event.target.value)} value={form.address} />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Edition description
            <textarea className={`${inputClass} min-h-28`} maxLength={20000} onChange={(event) => setValue("description", event.target.value)} value={form.description} />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Featured highlights
            <textarea
              className={`${inputClass} min-h-28`}
              maxLength={10000}
              onChange={(event) => setValue("featuredHighlights", event.target.value)}
              placeholder="Enter one highlight per line"
              value={form.featuredHighlights}
            />
            <span className="mt-1 block text-xs font-normal text-slate-500">
              Each non-empty line is displayed as a separate highlight.
            </span>
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
            <input checked={form.published} onChange={(event) => setValue("published", event.target.checked)} type="checkbox" />
            Publish this edition
          </label>
          {updatedAt && (
            <p className="text-xs text-slate-500 sm:col-span-2">Last updated {formatDateTime(updatedAt)}</p>
          )}
        </section>

        <section className="space-y-5 rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
          <div>
            <h3 className="text-base font-semibold text-slate-900">Related content</h3>
            <p className="mt-1 text-sm text-slate-500">
              Choose existing records. No event, image, or sponsor data is duplicated.
            </p>
          </div>
          {associationGroups.map(({ type, label, field }) => (
            <div className="border-t border-slate-100 pt-4" key={type}>
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                <h4 className="text-sm font-semibold text-slate-800">
                  {label} <span className="font-normal text-slate-400">({form[field].length} selected)</span>
                </h4>
                <input
                  aria-label={`Search ${label.toLowerCase()}`}
                  className={`${inputClass} mt-0 sm:max-w-xs`}
                  onChange={(event) =>
                    setSearches((current) => ({ ...current, [type]: event.target.value }))
                  }
                  placeholder={`Search ${label.toLowerCase()}`}
                  value={searches[type]}
                />
              </div>
              {options[type].length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">No matching records.</p>
              ) : (
                <div className="mt-3 grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
                  {options[type].map((option) => (
                    <label
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3 hover:border-[#d7b4ba]"
                      key={option.id}
                    >
                      <input
                        checked={form[field].includes(option.id)}
                        onChange={() => toggleAssociation(field, option.id)}
                        type="checkbox"
                      />
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-medium text-slate-800">
                          {option.label}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                          {option.detail || option.status}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>

        <div className="flex flex-wrap justify-end gap-3">
          <button className={buttonClass} onClick={cancel} type="button">Cancel</button>
          <button className={primaryButtonClass} disabled={isSaving || !dirty} type="submit">
            {isSaving ? "Saving..." : "Save edition"}
          </button>
        </div>
      </form>
    </div>
  );
}
