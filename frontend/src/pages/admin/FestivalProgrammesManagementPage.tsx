import axios from "axios";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Pencil,
  Plus,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate, useOutletContext, useParams } from "react-router-dom";
import {
  AdminDataTable,
  type AdminDataTableColumn,
} from "../../components/admin/AdminDataTable";
import { AdminPageHeader } from "../../components/admin/AdminPageHeader";
import { AdminToast } from "../../components/admin/AdminToast";
import { StatusBadge } from "../../components/admin/StatusBadge";
import {
  createAdminFestivalProgramme,
  deleteAdminFestivalProgramme,
  getAdminFestival,
  getAdminFestivalEdition,
  getAdminFestivalProgramme,
  getAdminFestivalProgrammes,
  publishAdminFestivalProgramme,
  reorderAdminFestivalProgrammes,
  unpublishAdminFestivalProgramme,
  updateAdminFestivalProgramme,
} from "../../services/adminService";
import type {
  FestivalEditionResponse,
  FestivalProgrammeRequest,
  FestivalProgrammeResponse,
  FestivalResponse,
} from "../../types/api";

type AdminOutletContext = {
  authorization: string;
  onLogout: () => void;
  onUnsavedChangesChange: (hasChanges: boolean) => void;
};

type BackendError = { message?: string };
type Toast = { message: string; variant: "success" | "error" };

const buttonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60";
const primaryButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#7b1e2b] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#641925] disabled:cursor-wait disabled:opacity-60";
const inputClass =
  "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#7b1e2b] focus:ring-2 focus:ring-[#7b1e2b]/10";
const labelClass = "block text-sm font-medium text-slate-700";
const dateFormatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });
const timeFormatter = new Intl.DateTimeFormat("en-IN", { timeStyle: "short" });

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

function formatProgrammeDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function formatProgrammeTime(programme: FestivalProgrammeResponse) {
  const [hours, minutes] = programme.startTime.split(":").map(Number);
  const start = Number.isInteger(hours) && Number.isInteger(minutes)
    ? timeFormatter.format(new Date(2000, 0, 1, hours, minutes))
    : programme.startTime;
  if (!programme.endTime) return start;
  const [endHours, endMinutes] = programme.endTime.split(":").map(Number);
  const end = Number.isInteger(endHours) && Number.isInteger(endMinutes)
    ? timeFormatter.format(new Date(2000, 0, 1, endHours, endMinutes))
    : programme.endTime;
  return `${start} – ${end}${programme.endTime < programme.startTime ? " (next day)" : ""}`;
}

function compareProgrammes(left: FestivalProgrammeResponse, right: FestivalProgrammeResponse) {
  return left.programmeDate.localeCompare(right.programmeDate)
    || left.displayOrder - right.displayOrder
    || left.startTime.localeCompare(right.startTime)
    || left.id - right.id;
}

function programmePath(festivalId: number, editionId: number) {
  return `/admin/festivals/${festivalId}/editions/${editionId}/programmes`;
}

export function FestivalProgrammesPage() {
  const { authorization, onLogout } = useOutletContext<AdminOutletContext>();
  const { festivalId = "", editionId = "" } = useParams();
  const numericFestivalId = Number(festivalId);
  const numericEditionId = Number(editionId);
  const invalidRoute =
    !Number.isSafeInteger(numericFestivalId)
    || numericFestivalId <= 0
    || !Number.isSafeInteger(numericEditionId)
    || numericEditionId <= 0;
  const [festival, setFestival] = useState<FestivalResponse | null>(null);
  const [edition, setEdition] = useState<FestivalEditionResponse | null>(null);
  const [programmes, setProgrammes] = useState<FestivalProgrammeResponse[]>([]);
  const [dateFilter, setDateFilter] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [mutatingId, setMutatingId] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (invalidRoute) return;
    let active = true;
    Promise.all([
      getAdminFestival(authorization, numericFestivalId),
      getAdminFestivalEdition(authorization, numericFestivalId, numericEditionId),
      getAdminFestivalProgrammes(
        authorization,
        numericFestivalId,
        numericEditionId,
        dateFilter || undefined,
      ),
    ])
      .then(([festivalResponse, editionResponse, programmeResponse]) => {
        if (!active) return;
        setFestival(festivalResponse);
        setEdition(editionResponse);
        setProgrammes([...programmeResponse].sort(compareProgrammes));
        setError(null);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(getErrorMessage(loadError, "Festival programmes could not be loaded.", onLogout));
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authorization, dateFilter, invalidRoute, numericEditionId, numericFestivalId, onLogout, refreshKey]);

  async function changePublication(programme: FestivalProgrammeResponse) {
    setMutatingId(programme.id);
    try {
      if (programme.published) {
        await unpublishAdminFestivalProgramme(
          authorization,
          numericFestivalId,
          numericEditionId,
          programme.id,
        );
        setToast({ message: "Programme unpublished.", variant: "success" });
      } else {
        await publishAdminFestivalProgramme(
          authorization,
          numericFestivalId,
          numericEditionId,
          programme.id,
        );
        setToast({ message: "Programme published.", variant: "success" });
      }
      setRefreshKey((current) => current + 1);
    } catch (mutationError) {
      setToast({
        message: getErrorMessage(mutationError, "Programme publication could not be changed.", onLogout),
        variant: "error",
      });
    } finally {
      setMutatingId(null);
    }
  }

  async function deleteProgramme(programme: FestivalProgrammeResponse) {
    if (!window.confirm(`Delete "${programme.title}"? It will be retained as deleted history.`)) return;
    setMutatingId(programme.id);
    try {
      await deleteAdminFestivalProgramme(
        authorization,
        numericFestivalId,
        numericEditionId,
        programme.id,
      );
      setToast({ message: "Programme deleted.", variant: "success" });
      setRefreshKey((current) => current + 1);
    } catch (mutationError) {
      setToast({
        message: getErrorMessage(mutationError, "Programme could not be deleted.", onLogout),
        variant: "error",
      });
    } finally {
      setMutatingId(null);
    }
  }

  async function moveProgramme(programme: FestivalProgrammeResponse, direction: -1 | 1) {
    const sameDay = programmes
      .filter((item) => item.programmeDate === programme.programmeDate)
      .sort(compareProgrammes);
    const currentIndex = sameDay.findIndex((item) => item.id === programme.id);
    const targetIndex = currentIndex + direction;
    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= sameDay.length) return;
    [sameDay[currentIndex], sameDay[targetIndex]] = [sameDay[targetIndex], sameDay[currentIndex]];
    setMutatingId(programme.id);
    try {
      await reorderAdminFestivalProgrammes(authorization, numericFestivalId, numericEditionId, {
        programmeDate: programme.programmeDate,
        programmeIds: sameDay.map((item) => item.id),
      });
      setToast({ message: "Programme order saved.", variant: "success" });
      setRefreshKey((current) => current + 1);
    } catch (mutationError) {
      setToast({
        message: getErrorMessage(mutationError, "Programme order could not be changed.", onLogout),
        variant: "error",
      });
    } finally {
      setMutatingId(null);
    }
  }

  const columns: AdminDataTableColumn<FestivalProgrammeResponse>[] = [
    {
      id: "programme",
      header: "Programme",
      render: (programme) => (
        <div>
          <Link
            className="font-semibold text-slate-900 hover:text-[#7b1e2b]"
            to={`${programmePath(numericFestivalId, numericEditionId)}/${programme.id}`}
          >
            {programme.title}
          </Link>
          {programme.description && (
            <p className="mt-1 max-w-xl text-xs text-slate-500">{programme.description}</p>
          )}
        </div>
      ),
    },
    {
      id: "date",
      header: "Date",
      render: (programme) => formatProgrammeDate(programme.programmeDate),
    },
    {
      id: "time",
      header: "Time",
      render: (programme) => formatProgrammeTime(programme),
    },
    {
      id: "venue",
      header: "Venue",
      render: (programme) => programme.venue || "Not set",
    },
    {
      id: "publication",
      header: "Publication",
      render: (programme) => (
        <StatusBadge
          label={programme.published ? "Published" : "Draft"}
          variant={programme.published ? "success" : "neutral"}
        />
      ),
    },
    {
      id: "actions",
      header: "Actions",
      className: "whitespace-nowrap",
      render: (programme) => {
        const sameDay = programmes
          .filter((item) => item.programmeDate === programme.programmeDate)
          .sort(compareProgrammes);
        const index = sameDay.findIndex((item) => item.id === programme.id);
        return (
          <div className="flex items-center gap-1">
            <button
              aria-label={`Move ${programme.title} up`}
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
              disabled={index <= 0 || mutatingId !== null}
              onClick={() => void moveProgramme(programme, -1)}
              type="button"
            >
              <ArrowUp size={16} />
            </button>
            <button
              aria-label={`Move ${programme.title} down`}
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-40"
              disabled={index < 0 || index >= sameDay.length - 1 || mutatingId !== null}
              onClick={() => void moveProgramme(programme, 1)}
              type="button"
            >
              <ArrowDown size={16} />
            </button>
            <Link
              aria-label={`Edit ${programme.title}`}
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 hover:text-[#7b1e2b]"
              to={`${programmePath(numericFestivalId, numericEditionId)}/${programme.id}`}
            >
              <Pencil size={16} />
            </Link>
            <button
              aria-label={programme.published ? "Unpublish programme" : "Publish programme"}
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
              disabled={mutatingId === programme.id}
              onClick={() => void changePublication(programme)}
              type="button"
            >
              {programme.published ? <Undo2 size={16} /> : <Send size={16} />}
            </button>
            <button
              aria-label={`Delete ${programme.title}`}
              className="rounded-md p-2 text-slate-500 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
              disabled={mutatingId === programme.id}
              onClick={() => void deleteProgramme(programme)}
              type="button"
            >
              <Trash2 size={16} />
            </button>
          </div>
        );
      },
    },
  ];

  if (invalidRoute || error) {
    return (
      <div className="space-y-5">
        <Link
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#7b1e2b]"
          to={`/admin/festivals/${numericFestivalId}/editions`}
        >
          <ArrowLeft size={16} />
          Festival editions
        </Link>
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? "Festival or edition not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#7b1e2b]"
        to={`/admin/festivals/${numericFestivalId}/editions`}
      >
        <ArrowLeft size={16} />
        {festival?.name ?? "Festival"} editions
      </Link>
      <AdminPageHeader
        title={`${festival?.name ?? "Festival"} ${edition?.year ?? ""} programmes`}
        description="Manage the published daily schedule for this annual edition."
        actions={
          <Link className={primaryButtonClass} to={`${programmePath(numericFestivalId, numericEditionId)}/new`}>
            <Plus size={16} />
            Add programme
          </Link>
        }
      />
      {toast && <AdminToast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
      <div className="max-w-xs">
        <label className="block text-sm font-medium text-slate-700" htmlFor="programme-date-filter">
          Filter by date
        </label>
        <input
          className={inputClass}
          id="programme-date-filter"
          onChange={(event) => {
            setIsLoading(true);
            setDateFilter(event.target.value);
          }}
          type="date"
          value={dateFilter}
        />
      </div>
      <AdminDataTable
        columns={columns}
        rows={programmes}
        getRowKey={(programme) => programme.id}
        isLoading={isLoading}
        emptyMessage={dateFilter ? "No programmes are scheduled for this date." : "No programmes have been added to this edition."}
        loadingMessage="Loading programmes..."
      />
    </div>
  );
}

type ProgrammeForm = {
  title: string;
  description: string;
  programmeDate: string;
  startTime: string;
  endTime: string;
  venue: string;
  displayOrder: string;
  published: boolean;
};

const emptyProgrammeForm: ProgrammeForm = {
  title: "",
  description: "",
  programmeDate: "",
  startTime: "",
  endTime: "",
  venue: "",
  displayOrder: "0",
  published: false,
};

function toProgrammeForm(programme: FestivalProgrammeResponse): ProgrammeForm {
  return {
    title: programme.title,
    description: programme.description ?? "",
    programmeDate: programme.programmeDate,
    startTime: programme.startTime.slice(0, 5),
    endTime: programme.endTime?.slice(0, 5) ?? "",
    venue: programme.venue ?? "",
    displayOrder: String(programme.displayOrder),
    published: programme.published,
  };
}

function programmeRequest(form: ProgrammeForm): FestivalProgrammeRequest {
  return {
    title: form.title.trim(),
    description: form.description.trim() || null,
    programmeDate: form.programmeDate,
    startTime: form.startTime,
    endTime: form.endTime || null,
    venue: form.venue.trim() || null,
    displayOrder: Number(form.displayOrder),
    published: form.published,
  };
}

export function FestivalProgrammeEditorPage() {
  const { authorization, onLogout, onUnsavedChangesChange } =
    useOutletContext<AdminOutletContext>();
  const { festivalId = "", editionId = "", programmeId = "" } = useParams();
  const navigate = useNavigate();
  const numericFestivalId = Number(festivalId);
  const numericEditionId = Number(editionId);
  const isNew = programmeId === "new";
  const numericProgrammeId = Number(programmeId);
  const invalidRoute =
    !Number.isSafeInteger(numericFestivalId)
    || numericFestivalId <= 0
    || !Number.isSafeInteger(numericEditionId)
    || numericEditionId <= 0
    || (!isNew && (!Number.isSafeInteger(numericProgrammeId) || numericProgrammeId <= 0));
  const [festival, setFestival] = useState<FestivalResponse | null>(null);
  const [edition, setEdition] = useState<FestivalEditionResponse | null>(null);
  const [form, setForm] = useState<ProgrammeForm>(emptyProgrammeForm);
  const [initialForm, setInitialForm] = useState<ProgrammeForm>(emptyProgrammeForm);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const dirty = JSON.stringify(form) !== JSON.stringify(initialForm);

  useEffect(() => {
    if (invalidRoute) return;
    let active = true;
    const programmePromise = isNew
      ? Promise.resolve(null)
      : getAdminFestivalProgramme(
          authorization,
          numericFestivalId,
          numericEditionId,
          numericProgrammeId,
        );
    Promise.all([
      getAdminFestival(authorization, numericFestivalId),
      getAdminFestivalEdition(authorization, numericFestivalId, numericEditionId),
      programmePromise,
    ])
      .then(([festivalResponse, editionResponse, programme]) => {
        if (!active) return;
        setFestival(festivalResponse);
        setEdition(editionResponse);
        if (programme) {
          const nextForm = toProgrammeForm(programme);
          setForm(nextForm);
          setInitialForm(nextForm);
          setUpdatedAt(programme.updatedAt);
        } else {
          const nextForm = { ...emptyProgrammeForm, programmeDate: editionResponse.startDate ?? "" };
          setForm(nextForm);
          setInitialForm(nextForm);
          setUpdatedAt(null);
        }
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(getErrorMessage(loadError, "Festival programme could not be loaded.", onLogout));
        }
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [
    authorization,
    isNew,
    numericEditionId,
    numericFestivalId,
    numericProgrammeId,
    invalidRoute,
    onLogout,
  ]);

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

  function setValue<Key extends keyof ProgrammeForm>(key: Key, value: ProgrammeForm[Key]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function cancel() {
    if (dirty && !window.confirm("Discard your unsaved programme changes?")) return;
    onUnsavedChangesChange(false);
    navigate(programmePath(numericFestivalId, numericEditionId));
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setToast(null);
    try {
      const request = programmeRequest(form);
      const programme = isNew
        ? await createAdminFestivalProgramme(
            authorization,
            numericFestivalId,
            numericEditionId,
            request,
          )
        : await updateAdminFestivalProgramme(
            authorization,
            numericFestivalId,
            numericEditionId,
            numericProgrammeId,
            request,
          );
      const nextForm = toProgrammeForm(programme);
      setForm(nextForm);
      setInitialForm(nextForm);
      setUpdatedAt(programme.updatedAt);
      setToast({ message: isNew ? "Festival programme created." : "Programme changes saved.", variant: "success" });
      onUnsavedChangesChange(false);
      if (isNew) {
        navigate(`${programmePath(numericFestivalId, numericEditionId)}/${programme.id}`, { replace: true });
      }
    } catch (saveError) {
      setToast({
        message: getErrorMessage(saveError, "Festival programme could not be saved.", onLogout),
        variant: "error",
      });
    } finally {
      setIsSaving(false);
    }
  }

  const backPath = programmePath(numericFestivalId, numericEditionId);
  if (invalidRoute || error) {
    return (
      <div className="space-y-5">
        <Link className="inline-flex items-center gap-2 text-sm font-medium text-slate-600" to={backPath}>
          <ArrowLeft size={16} />
          Festival programmes
        </Link>
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error ?? "Festival, edition, or programme not found."}
        </p>
      </div>
    );
  }
  if (isLoading) return <p className="text-sm text-slate-500">Loading festival programme...</p>;

  return (
    <div className="space-y-6">
      <Link
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-[#7b1e2b]"
        to={backPath}
      >
        <ArrowLeft size={16} />
        {festival?.name ?? "Festival"} {edition?.year ?? ""} programmes
      </Link>
      <AdminPageHeader
        title={isNew ? "Add festival programme" : `Edit ${form.title || "programme"}`}
        description="Schedule a programme for this festival edition. Ending earlier than it starts marks an overnight programme."
      />
      {toast && <AdminToast message={toast.message} variant={toast.variant} onDismiss={() => setToast(null)} />}
      <form className="space-y-6" onSubmit={(event) => void save(event)}>
        <section className="grid gap-5 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2 sm:p-6">
          <label className={labelClass}>
            Programme title *
            <input
              className={inputClass}
              maxLength={200}
              onChange={(event) => setValue("title", event.target.value)}
              required
              value={form.title}
            />
          </label>
          <label className={labelClass}>
            Programme date *
            <input
              className={inputClass}
              onChange={(event) => setValue("programmeDate", event.target.value)}
              required
              type="date"
              value={form.programmeDate}
            />
          </label>
          <label className={labelClass}>
            Start time *
            <input
              className={inputClass}
              onChange={(event) => setValue("startTime", event.target.value)}
              required
              type="time"
              value={form.startTime}
            />
          </label>
          <label className={labelClass}>
            End time
            <input
              className={inputClass}
              onChange={(event) => setValue("endTime", event.target.value)}
              type="time"
              value={form.endTime}
            />
          </label>
          <label className={labelClass}>
            Venue
            <input
              className={inputClass}
              maxLength={255}
              onChange={(event) => setValue("venue", event.target.value)}
              value={form.venue}
            />
          </label>
          <label className={labelClass}>
            Display order
            <input
              className={inputClass}
              min={0}
              onChange={(event) => setValue("displayOrder", event.target.value)}
              required
              step={1}
              type="number"
              value={form.displayOrder}
            />
          </label>
          <label className={`${labelClass} sm:col-span-2`}>
            Description
            <textarea
              className={inputClass}
              maxLength={20000}
              onChange={(event) => setValue("description", event.target.value)}
              rows={5}
              value={form.description}
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700 sm:col-span-2">
            <input
              checked={form.published}
              onChange={(event) => setValue("published", event.target.checked)}
              type="checkbox"
            />
            Publish programme
          </label>
          {updatedAt && (
            <p className="text-xs text-slate-500 sm:col-span-2">
              Last updated {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(updatedAt))}
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
