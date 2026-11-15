import { useEffect, useMemo, useState, type FormEvent } from "react";
import { AdminFormActions } from "../../components/admin/AdminFormActions";
import { ErrorState } from "../../components/ui/ErrorState";
import type {
  CommunityInitiativeRequest,
  CommunityInitiativeResponse,
  EventResponse,
  InitiativeStatus,
} from "../../types/api";

type InitiativeFormValues = {
  title: string;
  slug: string;
  category: string;
  shortDescription: string;
  description: string;
  imageUrl: string;
  startDate: string;
  endDate: string;
  location: string;
  status: InitiativeStatus;
  published: boolean;
  relatedEventIds: number[];
};

type InitiativeFormProps = {
  initiative: CommunityInitiativeResponse | null;
  events: EventResponse[];
  eventSearch: string;
  eventsError: string | null;
  isEventsLoading: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
  onDirtyChange: (hasChanges: boolean) => void;
  onEventSearchChange: (search: string) => void;
  onSubmit: (request: CommunityInitiativeRequest) => void;
};

type RelatedEventOption = Pick<
  EventResponse,
  "id" | "title" | "slug" | "startAt" | "status" | "published"
>;

const controlClass =
  "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#7b1e2b] focus:ring-2 focus:ring-[#7b1e2b]/10";
const initiativeStatuses: InitiativeStatus[] = ["PLANNED", "ACTIVE", "COMPLETED"];

function isInitiativeStatus(value: string): value is InitiativeStatus {
  return initiativeStatuses.some((status) => status === value);
}

function emptyValues(): InitiativeFormValues {
  return {
    title: "",
    slug: "",
    category: "",
    shortDescription: "",
    description: "",
    imageUrl: "",
    startDate: "",
    endDate: "",
    location: "",
    status: "PLANNED",
    published: false,
    relatedEventIds: [],
  };
}

function valuesFromInitiative(initiative: CommunityInitiativeResponse | null): InitiativeFormValues {
  if (!initiative) return emptyValues();
  return {
    title: initiative.title,
    slug: initiative.slug,
    category: initiative.category ?? "",
    shortDescription: initiative.shortDescription ?? "",
    description: initiative.description,
    imageUrl: initiative.imageUrl ?? "",
    startDate: initiative.startDate ?? "",
    endDate: initiative.endDate ?? "",
    location: initiative.location ?? "",
    status: initiative.status,
    published: initiative.published,
    relatedEventIds: initiative.relatedEvents.map((event) => event.id),
  };
}

function optionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

function createSlug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function formatEventDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(date);
}

export function InitiativeForm({
  initiative,
  events,
  eventSearch,
  eventsError,
  isEventsLoading,
  isSubmitting,
  onCancel,
  onDirtyChange,
  onEventSearchChange,
  onSubmit,
}: InitiativeFormProps) {
  const initialValues = useMemo(() => valuesFromInitiative(initiative), [initiative]);
  const [values, setValues] = useState<InitiativeFormValues>(initialValues);
  const [slugWasEdited, setSlugWasEdited] = useState(false);
  const hasChanges = JSON.stringify(values) !== JSON.stringify(initialValues);
  const hasInvalidDateRange = Boolean(
    values.startDate && values.endDate && values.endDate < values.startDate,
  );
  const relatedEventOptions = useMemo(() => {
    const options = new Map<number, RelatedEventOption>(events.map((event) => [event.id, event]));
    initiative?.relatedEvents.forEach((event) => {
      if (!options.has(event.id)) {
        options.set(event.id, event);
      }
    });
    return [...options.values()].sort((first, second) => first.title.localeCompare(second.title));
  }, [events, initiative]);

  useEffect(() => {
    onDirtyChange(hasChanges);
  }, [hasChanges, onDirtyChange]);

  useEffect(() => () => onDirtyChange(false), [onDirtyChange]);

  function update<K extends keyof InitiativeFormValues>(key: K, value: InitiativeFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleCancel() {
    if (hasChanges && !window.confirm("Discard your unsaved initiative changes?")) return;
    onCancel();
  }

  function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (hasInvalidDateRange) return;

    onSubmit({
      title: values.title.trim(),
      slug: values.slug.trim(),
      category: optionalValue(values.category),
      shortDescription: optionalValue(values.shortDescription),
      description: values.description.trim(),
      imageUrl: optionalValue(values.imageUrl),
      startDate: values.startDate || null,
      endDate: values.endDate || null,
      location: optionalValue(values.location),
      status: values.status,
      published: values.published,
      relatedEventIds: values.relatedEventIds,
    });
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-slate-900">
          {initiative ? "Edit initiative" : "Create initiative"}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Only published, active initiatives are shown on the public website.
        </p>
      </div>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <fieldset className="space-y-5" disabled={isSubmitting}>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Title *</span>
              <input
                className={controlClass}
                maxLength={200}
                onChange={(event) => {
                  const title = event.target.value;
                  update("title", title);
                  if (!slugWasEdited) update("slug", createSlug(title));
                }}
                required
                value={values.title}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Slug *</span>
              <input
                className={controlClass}
                maxLength={255}
                onChange={(event) => {
                  setSlugWasEdited(true);
                  update("slug", event.target.value);
                }}
                pattern="[a-z0-9]+(-[a-z0-9]+)*"
                required
                value={values.slug}
              />
              <span className="mt-1 block text-xs text-slate-500">
                Use lowercase letters, numbers, and hyphens.
              </span>
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Category</span>
              <input
                className={controlClass}
                maxLength={100}
                onChange={(event) => update("category", event.target.value)}
                value={values.category}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Cover image URL</span>
              <input
                className={controlClass}
                onChange={(event) => update("imageUrl", event.target.value)}
                type="url"
                value={values.imageUrl}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Short description</span>
            <textarea
              className={controlClass}
              maxLength={500}
              onChange={(event) => update("shortDescription", event.target.value)}
              rows={2}
              value={values.shortDescription}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Full description *</span>
            <textarea
              className={controlClass}
              maxLength={20000}
              onChange={(event) => update("description", event.target.value)}
              required
              rows={5}
              value={values.description}
            />
          </label>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Start date</span>
              <input
                className={controlClass}
                onChange={(event) => update("startDate", event.target.value)}
                type="date"
                value={values.startDate}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">End date</span>
              <input
                className={controlClass}
                min={values.startDate || undefined}
                onChange={(event) => update("endDate", event.target.value)}
                type="date"
                value={values.endDate}
              />
            </label>
          </div>
          {hasInvalidDateRange && (
            <p className="-mt-3 text-sm text-red-700" role="alert">
              End date cannot be before the start date.
            </p>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Location</span>
              <input
                className={controlClass}
                maxLength={255}
                onChange={(event) => update("location", event.target.value)}
                value={values.location}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Status</span>
              <select
                className={controlClass}
                onChange={(event) => {
                  const status = event.target.value;
                  if (isInitiativeStatus(status)) {
                    update("status", status);
                  }
                }}
                value={values.status}
              >
                {initiativeStatuses.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="flex items-center gap-3 rounded-lg border border-slate-200 px-3.5 py-3 text-sm font-medium text-slate-700">
            <input
              checked={values.published}
              className="size-4 accent-[#7b1e2b]"
              onChange={(event) => update("published", event.target.checked)}
              type="checkbox"
            />
            Publish initiative
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-700">Related events</span>
            <input
              aria-label="Search related events by title"
              className={controlClass}
              onChange={(event) => onEventSearchChange(event.target.value)}
              placeholder="Search events by title"
              value={eventSearch}
            />
            <select
              className={controlClass}
              multiple
              onChange={(event) => update(
                "relatedEventIds",
                Array.from(event.currentTarget.selectedOptions, (option) => Number(option.value)),
              )}
              size={Math.min(6, Math.max(3, relatedEventOptions.length))}
              value={values.relatedEventIds.map(String)}
            >
              {relatedEventOptions.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.title} — {formatEventDate(event.startAt)}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-slate-500">
              Use Ctrl or Command to select more than one event. Event records remain independent.
            </span>
          </label>
          {isEventsLoading && <p className="text-sm text-slate-500">Loading events...</p>}
          {eventsError && <ErrorState message={eventsError} />}
          {!isEventsLoading && !eventsError && relatedEventOptions.length === 0 && (
            <p className="text-sm text-slate-500">No active events are available to associate.</p>
          )}
        </fieldset>

        <AdminFormActions
          isSubmitting=          {isSubmitting}
          onCancel={handleCancel}
          submitLabel={initiative ? "Save changes" : "Create initiative"}
        />
      </form>
    </section>
  );
}
