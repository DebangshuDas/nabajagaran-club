import axios from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FestivalLayout } from "../components/ui/FestivalLayout";
import { getPublicFestival } from "../services/siteService";
import type { FestivalEditionResponse, FestivalPublicResponse } from "../types/api";

const dateFormatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
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

export default function DurgaPujaPage() {
  const [festival, setFestival] = useState<FestivalPublicResponse | null>(null);
  const [selectedEditionId, setSelectedEditionId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getPublicFestival("durga-puja")
      .then((response) => {
        if (!active) return;
        setFestival(response);
        setSelectedEditionId(response.editions[0]?.id ?? null);
      })
      .catch((error: unknown) => {
        if (!active) return;
        setLoadError(
          axios.isAxiosError(error) && error.response?.status === 404
            ? "The Durga Puja profile has not been published yet."
            : "Durga Puja information is temporarily unavailable.",
        );
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const editions = festival?.editions ?? [];
  const selectedEdition =
    editions.find((edition) => edition.id === selectedEditionId) ?? editions[0];
  const highlights = highlightsFor(selectedEdition);
  const about = [
    festival?.description?.trim(),
    festival?.history?.trim(),
  ].filter((paragraph): paragraph is string => Boolean(paragraph));

  if (!about.length) {
    about.push(
      loadError
        ?? (isLoading
          ? "Loading published festival information."
          : "Festival details will appear here when the club publishes them."),
    );
  }

  const moments = [
    { title: "Dates", text: formatDateRange(selectedEdition?.startDate, selectedEdition?.endDate) },
    { title: "Venue", text: selectedEdition?.venue || "Not announced" },
    { title: "Theme", text: selectedEdition?.theme || "Not announced" },
  ];
  const hasAssociatedContent =
    highlights.length > 0
    || (selectedEdition?.galleryImages.length ?? 0) > 0
    || (selectedEdition?.sponsors.length ?? 0) > 0;

  return (
    <FestivalLayout
      bengali="দুর্গাপূজা"
      title={festival?.name ?? "Durga Puja"}
      lede={
        festival?.description?.trim()
        || loadError
        || (isLoading ? "Loading festival information..." : "Festival information will be shared here when published.")
      }
      photoLabel="Durga Puja"
      tone="maroon"
      aboutTitle="Festival profile"
      about={about}
      moments={moments}
      coverImageUrl={festival?.coverImageUrl}
      aside={
        <>
          <p className="text-xs font-medium tracking-[0.18em] text-maroon uppercase">
            {selectedEdition ? "Published edition" : "Festival programme"}
          </p>
          <h2 className="mt-3 font-display text-3xl text-maroon">
            {selectedEdition ? `${festival?.name ?? "Durga Puja"} ${selectedEdition.year}` : "No edition published"}
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
          ) : (
            <p className="mt-3 text-sm leading-relaxed text-ink/80">
              {loadError ?? "No programme items are linked to this published edition."}
            </p>
          )}
          <Link to="/events" className="mt-6 inline-flex text-sm font-medium text-maroon underline">
            Back to events
          </Link>
        </>
      }
    >
      {hasAssociatedContent && (
        <section className="mx-auto max-w-6xl space-y-14 px-5 pb-20 md:px-8">
          {highlights.length > 0 && (
            <div>
              <h2 className="font-display text-4xl text-maroon">Featured highlights</h2>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {highlights.map((highlight) => (
                  <li className="border border-line bg-white p-5 text-sm leading-relaxed text-ink" key={highlight}>
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
                      <img alt={image.label} className="aspect-[4/3] w-full object-cover" src={image.imageUrl} />
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
                  <li className="flex items-center gap-4 border border-line bg-white p-4" key={sponsor.id}>
                    {sponsor.imageUrl && (
                      <img alt="" className="size-14 shrink-0 object-contain" src={sponsor.imageUrl} />
                    )}
                    <span>
                      <span className="block font-medium text-ink">{sponsor.label}</span>
                      {sponsor.detail && <span className="mt-1 block text-sm text-muted">{sponsor.detail}</span>}
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
