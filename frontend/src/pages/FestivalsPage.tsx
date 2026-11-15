import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FestivalCard } from "../components/festival/FestivalCard";
import { getPublishedFestivals } from "../services/siteService";
import type { FestivalPublicSummaryResponse } from "../types/api";

export default function FestivalsPage() {
  const [festivals, setFestivals] = useState<FestivalPublicSummaryResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let active = true;
    getPublishedFestivals()
      .then((response) => {
        if (active) setFestivals(response);
      })
      .catch(() => {
        if (active) setError("Festival information is temporarily unavailable.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [reloadKey]);

  function retry() {
    setError(null);
    setIsLoading(true);
    setReloadKey((key) => key + 1);
  }

  return (
    <main>
      <section className="bg-maroon-dark px-5 py-16 text-ivory md:px-8 md:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-xs font-medium tracking-[0.22em] text-gold uppercase">Nabajagaran Club</p>
          <h1 className="mt-3 font-display text-5xl md:text-6xl">Festivals</h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-ivory/80">
            Explore the festivals the club has published.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-12 md:px-8 md:py-16">
        {isLoading ? (
          <p className="text-sm text-muted" role="status">Loading published festivals...</p>
        ) : error ? (
          <div className="border border-line bg-white p-6" role="alert">
            <p className="text-ink">{error}</p>
            <button
              className="mt-4 bg-maroon px-4 py-2 text-sm font-medium text-ivory"
              onClick={retry}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : festivals.length === 0 ? (
          <div className="border border-line bg-white p-8">
            <h2 className="font-display text-3xl text-maroon">No published festivals yet</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Festivals will appear here after the club publishes them.
            </p>
            <Link className="mt-5 inline-flex text-sm font-medium text-maroon underline" to="/">
              Return home
            </Link>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {festivals.map((festival) => (
              <FestivalCard festival={festival} key={festival.id} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
