import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import type { PhotoTone } from "../../data/site";
import { FestivalLayout } from "../ui/FestivalLayout";
import { getFestivalBySlug } from "../../services/siteService";
import type {
  FestivalEditionResponse,
  FestivalProgrammeResponse,
  FestivalPublicResponse,
} from "../../types/api";

type PublicFestivalPageProps = {
  slug: string;
  bengali: string;
  tone: PhotoTone;
  relatedLink: { label: string; to: string };
  generic?: boolean;
};

const dateFormatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });
const timeFormatter = new Intl.DateTimeFormat("en-IN", { timeStyle: "short" });

function titleFromSlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function formatTime(value: string) {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isInteger(hours) || !Number.isInteger(minutes)) return value;
  return timeFormatter.format(new Date(2000, 0, 1, hours, minutes));
}

function programmeTimeRange(programme: FestivalProgrammeResponse) {
  const start = formatTime(programme.startTime);
  if (!programme.endTime) return start;
  const end = formatTime(programme.endTime);
  const nextDay = programme.endTime < programme.startTime ? " (next day)" : "";
  return `${start} – ${end}${nextDay}`;
}

function groupProgrammesByDate(programmes: FestivalProgrammeResponse[]) {
  const groups = new Map<string, FestivalProgrammeResponse[]>();
  for (const programme of programmes) {
    const group = groups.get(programme.programmeDate) ?? [];
    group.push(programme);
    groups.set(programme.programmeDate, group);
  }
  return [...groups.entries()];
}

function formatDateRange(startDate?: string | null, endDate?: string | null) {
  const start = formatDate(startDate);
  const end = formatDate(endDate);
  if (start && end) return start === end ? start : `${start} – ${end}`;
  return start ?? end ?? "Not announced";
}

function highlightsFor(edition: FestivalEditionResponse | undefined) {
  return (edition?.featuredHighlights ?? "")
    .split(/\r?\n/)
    .map((highlight) => highlight.trim())
    .filter(Boolean);
}

export function PublicFestivalPage({
  slug,
  bengali,
  tone,
  relatedLink,
  generic = false,
}: PublicFestivalPageProps) {
  const [festival, setFestival] = useState<FestivalPublicResponse | null>(null);
  const [selectedEditionId, setSelectedEditionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [retryKey, setRetryKey] = useState(0);
  const [requestedSlug, setRequestedSlug] = useState<string | null>(null);
  const isCurrentRequest = requestedSlug === slug;
  const isCurrentLoading = !isCurrentRequest || isLoading;
  const currentFestival = isCurrentRequest ? festival : null;
  const currentLoadError = isCurrentRequest ? loadError : null;
  const currentNotFound = isCurrentRequest && notFound;
  const displayName = currentFestival?.name ?? titleFromSlug(slug);

  useEffect(() => {
    let active = true;
    getFestivalBySlug(slug)
      .then((response) => {
        if (!active) return;
        setFestival(response);
        setSelectedEditionId(response.editions[0]?.id ?? null);
        setLoadError(null);
        setNotFound(false);
        setIsLoading(false);
        setRequestedSlug(slug);
      })
      .catch((error: unknown) => {
        if (!active) return;
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          if (generic) {
            setNotFound(true);
          } else {
            setLoadError(`${titleFromSlug(slug)} profile has not been published yet.`);
          }
        } else {
          setLoadError(`${titleFromSlug(slug)} information is temporarily unavailable.`);
        }
        setIsLoading(false);
        setRequestedSlug(slug);
      });
    return () => {
      active = false;
    };
  }, [generic, retryKey, slug]);

  const editions = currentFestival?.editions ?? [];
  const selectedEdition =
    editions.find((edition) => edition.id === selectedEditionId) ?? editions[0];
  const programmes = [...(selectedEdition?.programmes ?? [])].sort((left, right) =>
    left.programmeDate.localeCompare(right.programmeDate)
    || left.displayOrder - right.displayOrder
    || left.startTime.localeCompare(right.startTime)
    || left.id - right.id,
  );
  const programmeGroups = groupProgrammesByDate(programmes);
  const highlights = highlightsFor(selectedEdition);
  const about = generic
    ? [currentFestival?.history?.trim()].filter((paragraph): paragraph is string => Boolean(paragraph))
    : [currentFestival?.description?.trim(), currentFestival?.history?.trim()]
      .filter((paragraph): paragraph is string => Boolean(paragraph));

  if (!generic && !about.length) {
    about.push(
      currentLoadError
        ?? (isCurrentLoading
          ? "Loading published festival information."
          : "Festival details will appear here when the club publishes them."),
    );
  }

  const moments = generic
    ? [
        selectedEdition?.startDate || selectedEdition?.endDate
          ? { title: "Dates", text: formatDateRange(selectedEdition.startDate, selectedEdition.endDate) }
          : null,
        selectedEdition?.venue ? { title: "Venue", text: selectedEdition.venue } : null,
        selectedEdition?.theme ? { title: "Theme", text: selectedEdition.theme } : null,
      ].filter((moment): moment is { title: string; text: string } => moment !== null)
    : [
        { title: "Dates", text: formatDateRange(selectedEdition?.startDate, selectedEdition?.endDate) },
        { title: "Venue", text: selectedEdition?.venue || "Not announced" },
        { title: "Theme", text: selectedEdition?.theme || "Not announced" },
      ];
  const hasAssociatedContent =
    programmes.length > 0
    || highlights.length > 0
    || (selectedEdition?.galleryImages.length ?? 0) > 0
    || (selectedEdition?.sponsors.length ?? 0) > 0;

  if (generic && isCurrentLoading) {
    return (
      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8" role="status">
        <p className="text-sm text-muted">Loading published festival...</p>
      </section>
    );
  }

  if (generic && currentNotFound) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-24 md:px-8">
        <p className="text-xs font-medium tracking-[0.22em] text-gold uppercase">404</p>
        <h1 className="mt-3 font-display text-5xl text-maroon">Festival not found</h1>
        <p className="mt-4 text-muted">This festival is not available or has not been published.</p>
        <Link className="mt-8 inline-flex bg-maroon px-5 py-3 text-sm text-ivory" to="/festivals">
          Browse festivals
        </Link>
      </section>
    );
  }

  if (generic && currentLoadError) {
    return (
      <section className="mx-auto max-w-3xl px-5 py-24 md:px-8" role="alert">
        <h1 className="font-display text-4xl text-maroon">Festival information unavailable</h1>
        <p className="mt-4 text-muted">{currentLoadError}</p>
        <button
          className="mt-8 bg-maroon px-5 py-3 text-sm text-ivory"
          onClick={() => {
            setIsLoading(true);
            setRequestedSlug(null);
            setFestival(null);
            setSelectedEditionId(null);
            setLoadError(null);
            setNotFound(false);
            setRetryKey((key) => key + 1);
          }}
          type="button"
        >
          Try again
        </button>
      </section>
    );
  }

  return (
    <FestivalLayout
      bengali={bengali}
      title={displayName}
      lede={generic
        ? currentFestival?.description?.trim() || undefined
        : (
        currentFestival?.description?.trim()
        || currentLoadError
        || (isCurrentLoading
          ? "Loading festival information..."
          : "Festival information will be shared here when published.")
        )}
      photoLabel={displayName}
      tone={tone}
      aboutTitle={
        generic
          ? about.length > 0
            ? "Festival history"
            : "Published edition details"
          : "Festival profile"
      }
      about={about}
      moments={moments}
      coverImageUrl={currentFestival?.coverImageUrl}
      showAbout={!generic || about.length > 0 || moments.length > 0}
      showAside={!generic || Boolean(selectedEdition?.description || selectedEdition?.events.length)}
      aside={
        <>
          <p className="text-xs font-medium tracking-[0.18em] text-maroon uppercase">
            {selectedEdition ? "Published edition" : "Festival programme"}
          </p>
          <h2 className="mt-3 font-display text-3xl text-maroon">
            {selectedEdition ? `${displayName} ${selectedEdition.year}` : "No edition published"}
          </h2>
          {editions.length > 1 && (
            <label className="mt-5 block text-sm font-medium text-ink">
              Browse editions
              <select
                className="mt-2 w-full border border-line bg-white px-3 py-2 text-sm"
                onChange={(event) => setSelectedEditionId(Number(event.target.value))}
                value={selectedEdition?.id ?? ""}
              >
                {editions.map((edition) => (
                  <option key={edition.id} value={edition.id}>{edition.year}</option>
                ))}
              </select>
            </label>
          )}
          {selectedEdition?.description && (
            <p className="mt-4 text-sm leading-relaxed text-ink/80">{selectedEdition.description}</p>
          )}
          {selectedEdition?.events.length ? (
            <ul className="mt-5 space-y-3">
              {selectedEdition.events.map((event) => (
                <li className="border-t border-gold/30 pt-3" key={event.id}>
                  <p className="text-sm font-semibold text-ink">{event.label}</p>
                  {event.startAt && (
                    <p className="mt-1 text-xs text-muted">
                      {formatDate(event.startAt)}{event.detail ? ` · ${event.detail}` : ""}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          ) : !generic && (
            <p className="mt-3 text-sm leading-relaxed text-ink/80">
              {currentLoadError ?? "No events are linked to this published edition."}
            </p>
          )}
          <Link
            to={relatedLink.to}
            className="mt-6 inline-flex text-sm font-medium text-maroon underline"
          >
            {relatedLink.label}
          </Link>
        </>
      }
    >
      {hasAssociatedContent && (
        <section className="mx-auto max-w-6xl space-y-14 px-5 pb-20 md:px-8">
          {programmeGroups.length > 0 && (
            <div>
              <h2 className="font-display text-4xl text-maroon">Daily programme</h2>
              <div className="mt-6 space-y-8">
                {programmeGroups.map(([date, dayProgrammes]) => (
                  <section className="border-l-2 border-gold pl-5" key={date}>
                    <h3 className="font-display text-2xl text-maroon">{formatDate(date)}</h3>
                    <ol className="mt-4 space-y-4">
                      {dayProgrammes.map((programme) => (
                        <li className="border-b border-line pb-4 last:border-b-0" key={programme.id}>
                          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                            <h4 className="font-semibold text-ink">{programme.title}</h4>
                            <p className="text-sm font-medium text-maroon">
                              {programmeTimeRange(programme)}
                            </p>
                          </div>
                          {programme.venue && (
                            <p className="mt-1 text-sm text-muted">{programme.venue}</p>
                          )}
                          {programme.description && (
                            <p className="mt-2 text-sm leading-relaxed text-ink/80">
                              {programme.description}
                            </p>
                          )}
                        </li>
                      ))}
                    </ol>
                  </section>
                ))}
              </div>
            </div>
          )}

          {highlights.length > 0 && (
            <div>
              <h2 className="font-display text-4xl text-maroon">Featured highlights</h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {highlights.map((highlight) => (
                  <li
                    className="border border-line bg-white p-5 text-sm leading-relaxed text-ink"
                    key={highlight}
                  >
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedEdition?.galleryImages.length ? (
            <div>
              <h2 className="font-display text-4xl text-maroon">Edition gallery</h2>
              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {selectedEdition.galleryImages.map((image) => (
                  <figure className="overflow-hidden border border-line bg-white" key={image.id}>
                    {image.imageUrl && (
                      <img
                        alt={image.altText?.trim() || image.label}
                        className="aspect-[4/3] w-full object-cover"
                        src={image.imageUrl}
                      />
                    )}
                    <figcaption className="p-4">
                      <p className="font-medium text-ink">{image.label}</p>
                      {image.detail && <p className="mt-1 text-sm text-muted">{image.detail}</p>}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </div>
          ) : null}

          {selectedEdition?.sponsors.length ? (
            <div>
              <h2 className="font-display text-4xl text-maroon">Edition sponsors</h2>
              <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {selectedEdition.sponsors.map((sponsor) => (
                  <li
                    className="flex items-center gap-4 border border-line bg-white p-4"
                    key={sponsor.id}
                  >
                    {sponsor.imageUrl && (
                      <img
                        alt=""
                        className="size-14 shrink-0 object-contain"
                        src={sponsor.imageUrl}
                      />
                    )}
                    <span>
                      <span className="block font-medium text-ink">{sponsor.label}</span>
                      {sponsor.detail && (
                        <span className="mt-1 block text-sm text-muted">{sponsor.detail}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>
      )}
    </FestivalLayout>
  );
}
