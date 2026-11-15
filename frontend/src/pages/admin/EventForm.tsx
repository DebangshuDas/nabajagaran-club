import { useState, type FormEvent } from "react";
import { AdminFormActions } from "../../components/admin/AdminFormActions";
import { SelectField, TextAreaField, TextField } from "../../components/ui/TextField";
import type { EventRequest, EventResponse, EventStatus } from "../../types/api";

type EventFormValues = {
  title: string;
  shortDescription: string;
  description: string;
  eventType: string;
  status: EventStatus;
  startAt: string;
  endAt: string;
  venue: string;
  address: string;
  capacity: string;
  imageUrl: string;
  published: boolean;
};

type EventFormProps = {
  event: EventResponse | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (request: EventRequest) => void;
};

const controlClass =
  "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2.5 text-sm outline-none transition focus:border-[#7b1e2b] focus:ring-2 focus:ring-[#7b1e2b]/10";
const eventStatuses: EventStatus[] = ["UPCOMING", "ONGOING", "COMPLETED"];

function isEventStatus(value: string): value is EventStatus {
  return eventStatuses.some((status) => status === value);
}

function emptyValues(): EventFormValues {
  return {
    title: "",
    shortDescription: "",
    description: "",
    eventType: "",
    status: "UPCOMING",
    startAt: "",
    endAt: "",
    venue: "",
    address: "",
    capacity: "",
    imageUrl: "",
    published: false,
  };
}

function valuesFromEvent(event: EventResponse | null): EventFormValues {
  if (!event) return emptyValues();
  return {
    title: event.title,
    shortDescription: event.shortDescription ?? "",
    description: event.description,
    eventType: event.eventType,
    status: event.status,
    startAt: dateTimeInputValue(event.startAt),
    endAt: dateTimeInputValue(event.endAt),
    venue: event.venue ?? "",
    address: event.address ?? "",
    capacity: event.capacity == null ? "" : String(event.capacity),
    imageUrl: event.imageUrl ?? "",
    published: event.published,
  };
}

function dateTimeInputValue(value: string | null | undefined) {
  return value ? value.slice(0, 16) : "";
}

function optionalValue(value: string) {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export function EventForm({ event, isSubmitting, onCancel, onSubmit }: EventFormProps) {
  const [values, setValues] = useState<EventFormValues>(() => valuesFromEvent(event));

  const hasInvalidSchedule = Boolean(values.startAt && values.endAt && values.endAt <= values.startAt);

  function update<K extends keyof EventFormValues>(key: K, value: EventFormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    if (hasInvalidSchedule) return;

    onSubmit({
      title: values.title.trim(),
      shortDescription: optionalValue(values.shortDescription),
      description: values.description.trim(),
      eventType: values.eventType.trim(),
      status: values.status,
      startAt: values.startAt,
      endAt: values.endAt || null,
      venue: optionalValue(values.venue),
      address: optionalValue(values.address),
      capacity: values.capacity === "" ? null : Number(values.capacity),
      imageUrl: optionalValue(values.imageUrl),
      published: values.published,
    });
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="mb-5">
        <h3 className="text-lg font-semibold text-slate-900">
          {event ? "Edit event" : "Create event"}
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          The event URL slug is generated from its title. Existing IDs and creation dates are preserved when editing.
        </p>
      </div>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <fieldset className="space-y-5" disabled={isSubmitting}>
          <div className="grid gap-5 md:grid-cols-2">
            <TextField
              id="event-title"
              label="Title"
              value={values.title}
              onChange={(value) => update("title", value)}
              required
            />
            <TextField
              id="event-type"
              label="Event type"
              value={values.eventType}
              onChange={(value) => update("eventType", value)}
              required
            />
          </div>

          <label className="block" htmlFor="event-short-description">
            <span className="text-sm font-medium text-ink">Short description</span>
            <textarea
              className={controlClass}
              id="event-short-description"
              maxLength={500}
              onChange={(changeEvent) => update("shortDescription", changeEvent.target.value)}
              rows={2}
              value={values.shortDescription}
            />
          </label>

          <TextAreaField
            id="event-description"
            label="Full description"
            value={values.description}
            onChange={(value) => update("description", value)}
            required
          />

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="event-start-at">
              Start date and time *
              <input
                className={controlClass}
                id="event-start-at"
                onChange={(changeEvent) => update("startAt", changeEvent.target.value)}
                required
                type="datetime-local"
                value={values.startAt}
              />
            </label>
            <label className="block text-sm font-medium text-slate-700" htmlFor="event-end-at">
              End date and time
              <input
                className={controlClass}
                id="event-end-at"
                min={values.startAt || undefined}
                onChange={(changeEvent) => update("endAt", changeEvent.target.value)}
                type="datetime-local"
                value={values.endAt}
              />
            </label>
          </div>
          {hasInvalidSchedule && (
            <p className="-mt-3 text-sm text-red-700" role="alert">
              End date and time must be after the start date and time.
            </p>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <TextField
              id="event-venue"
              label="Venue"
              value={values.venue}
              onChange={(value) => update("venue", value)}
            />
            <TextField
              id="event-address"
              label="Address"
              value={values.address}
              onChange={(value) => update("address", value)}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700" htmlFor="event-capacity">
              Capacity
              <input
                className={controlClass}
                id="event-capacity"
                min="0"
                onChange={(changeEvent) => update("capacity", changeEvent.target.value)}
                step="1"
                type="number"
                value={values.capacity}
              />
            </label>
            <TextField
              id="event-image-url"
              label="Image URL"
              value={values.imageUrl}
              onChange={(value) => update("imageUrl", value)}
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <SelectField
              id="event-status"
              label="Status"
              value={values.status}
              onChange={(value) => {
                if (isEventStatus(value)) update("status", value);
              }}
              options={eventStatuses}
            />
            <label className="flex items-center gap-3 self-end rounded-lg border border-slate-200 px-3.5 py-3 text-sm font-medium text-slate-700">
              <input
                checked={values.published}
                className="size-4 accent-[#7b1e2b]"
                onChange={(changeEvent) => update("published", changeEvent.target.checked)}
                type="checkbox"
              />
              Publish event
            </label>
          </div>
        </fieldset>

        <AdminFormActions
          isSubmitting={isSubmitting}
          onCancel={onCancel}
          submitLabel={event ? "Save changes" : "Create event"}
        />
      </form>
    </section>
  );
}
