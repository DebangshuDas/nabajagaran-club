import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CtaBand } from "../components/ui/CtaBand";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHero } from "../components/ui/PageHero";
import { PhotoPlaceholder } from "../components/ui/PhotoPlaceholder";
import { getPublishedInitiatives } from "../services/siteService";
import type { CommunityInitiativeResponse } from "../types/api";
import { safeHttpUrl } from "../utils/urls";

const dateFormatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });
const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  dateStyle: "medium",
  timeStyle: "short",
});

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateTimeFormatter.format(date);
}

export default function InitiativesPage() {
  const [initiatives, setInitiatives] = useState<CommunityInitiativeResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let isCurrent = true;
    getPublishedInitiatives()
      .then((response) => {
        if (isCurrent) setInitiatives(response);
      })
      .catch(() => {
        if (isCurrent) setError("Community initiatives could not be loaded. Please try again.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [refreshKey]);

  return (
    <>
      <PageHero
        bengali="সেবা"
        eyebrow="Community initiatives"
        title="Community initiatives"
        lede="Explore the programmes and community work the club has chosen to publish."
        photoLabel="Community initiatives"
        tone="ivory"
      />
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        {isLoading ? (
          <LoadingState message="Loading published initiatives..." />
        ) : error ? (
          <div className="space-y-4">
            <ErrorState message={error} />
            <button
              className="rounded border border-maroon px-4 py-2 text-sm font-medium text-maroon hover:bg-maroon hover:text-white"
              onClick={() => {
                setIsLoading(true);
                setError(null);
                setRefreshKey((current) => current + 1);
              }}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : initiatives.length === 0 ? (
          <EmptyState message="There are no published community initiatives right now." />
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {initiatives.map((initiative, index) => {
              const coverImageUrl = safeHttpUrl(initiative.imageUrl);
              const startDate = formatDate(initiative.startDate);
              const endDate = formatDate(initiative.endDate);
              return (
                <article key={initiative.id} className="overflow-hidden border border-line bg-white">
                  {coverImageUrl ? (
                    <img
                      alt={initiative.title}
                      className="min-h-44 w-full object-cover"
                      loading="lazy"
                      src={coverImageUrl}
                    />
                  ) : (
                    <PhotoPlaceholder
                      label={`Photograph — ${initiative.title}`}
                      tone={index % 2 === 0 ? "maroon" : "gold"}
                      className="min-h-44"
                    />
                  )}
                  <div className="p-6">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {initiative.category && (
                        <p className="text-xs tracking-[0.18em] text-gold uppercase">
                          {initiative.category}
                        </p>
                      )}
                      <span className="rounded-full bg-maroon/5 px-3 py-1 text-xs font-medium text-maroon">
                        {initiative.status.toLowerCase()}
                      </span>
                    </div>
                    <h2 className="mt-2 font-display text-3xl text-maroon">{initiative.title}</h2>
                    {initiative.shortDescription && (
                      <p className="mt-3 font-medium leading-relaxed text-ink">
                        {initiative.shortDescription}
                      </p>
                    )}
                    <p className="mt-3 whitespace-pre-wrap leading-relaxed text-muted">
                      {initiative.description}
                    </p>
                    {(startDate || endDate || initiative.location) && (
                      <dl className="mt-5 grid gap-2 border-t border-line pt-4 text-sm sm:grid-cols-2">
                        {(startDate || endDate) && (
                          <div>
                            <dt className="font-medium text-ink">Dates</dt>
                            <dd className="mt-1 text-muted">
                              {startDate || "Date not specified"}
                              {endDate ? ` – ${endDate}` : ""}
                            </dd>
                          </div>
                        )}
                        {initiative.location && (
                          <div>
                            <dt className="font-medium text-ink">Location</dt>
                            <dd className="mt-1 text-muted">{initiative.location}</dd>
                          </div>
                        )}
                      </dl>
                    )}
                    {initiative.relatedEvents.length > 0 && (
                      <div className="mt-5 border-t border-line pt-4">
                        <h3 className="text-sm font-semibold text-ink">Related events</h3>
                        <ul className="mt-2 space-y-2">
                          {initiative.relatedEvents.map((event) => (
                            <li key={event.id} className="text-sm text-muted">
                              <Link className="font-medium text-maroon hover:underline" to="/events">
                                {event.title}
                              </Link>
                              <span className="ml-2">{formatDateTime(event.startAt)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
      <CtaBand
        title="Welfare work needs people as much as programmes."
        text="Use the membership page to say you would like to help. The form is stored only in this browser until a real process exists."
        action="Offer to take part"
        to="/membership"
      />
    </>
  );
}
