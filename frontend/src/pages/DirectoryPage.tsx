import { useEffect, useState } from "react";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHero } from "../components/ui/PageHero";
import { PlaceholderNote } from "../components/ui/PlaceholderNote";
import { getApprovedBusinesses } from "../services/siteService";
import type { BusinessResponse } from "../types/api";

export default function DirectoryPage() {
  const [businesses, setBusinesses] = useState<BusinessResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState("All");
  const [query, setQuery] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadBusinesses() {
      try {
        setLoading(true);
        setError(null);
        const response = await getApprovedBusinesses();

        if (!isMounted) return;
        setBusinesses(response);
      } catch (loadError) {
        if (!isMounted) return;
        setError(
          loadError instanceof Error ? loadError.message : "Unable to load local business listings."
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadBusinesses();

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = ["All", ...new Set((businesses || []).map((business) => business.categoryName || "General"))];

  const visible = (businesses || []).filter((business) => {
    const matchesCategory = category === "All" || (business.categoryName || "General") === category;
    const haystack = `${business.name} ${business.categoryName ?? ""} ${business.city ?? ""} ${business.description ?? ""}`.toLowerCase();
    return matchesCategory && haystack.includes(query.trim().toLowerCase());
  });

  return (
    <>
      <PageHero
        bengali="পাড়া"
        eyebrow="Local business directory"
        title="Neighbourhood recommendations"
        lede="Approved local businesses are listed here once the club confirms them for publication."
        photoLabel="Photograph — neighbourhood shopfront"
        tone="gold"
      />
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        <PlaceholderNote>
          Add a business only after it agrees to be listed. Publish the contact details the business
          itself provides.
        </PlaceholderNote>
        {loading ? (
          <div className="mt-8">
            <LoadingState message="Loading approved businesses..." />
          </div>
        ) : error ? (
          <div className="mt-8">
            <ErrorState message={error} />
          </div>
        ) : (
          <>
            <div className="mt-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
                {categories.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setCategory(item)}
                    className={`border px-3 py-2 text-sm transition ${
                      category === item
                        ? "border-maroon bg-maroon text-ivory"
                        : "border-line bg-white text-ink hover:border-gold"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
              <label className="block text-sm md:w-72">
                <span className="sr-only">Search listings</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search listings"
                  className="w-full border border-line bg-white px-4 py-3 outline-none focus:border-gold"
                />
              </label>
            </div>
            {visible.length === 0 ? (
              <div className="mt-10">
                <EmptyState message="No approved business matches that filter or search." />
              </div>
            ) : (
              <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {visible.map((business) => (
                  <article key={business.id} className="flex flex-col border border-line bg-white p-6">
                    <p className="text-[11px] font-medium tracking-[0.18em] text-gold uppercase">
                      {business.categoryName ?? "Business"}
                    </p>
                    <h2 className="mt-3 font-display text-3xl leading-tight text-maroon">{business.name}</h2>
                    <p className="mt-3 text-sm text-ink">{business.city ?? "Local listing"}</p>
                    <p className="mt-3 flex-1 text-sm leading-relaxed text-muted">
                      {business.description ?? "Community listing published by the club."}
                    </p>
                    <p className="mt-6 text-xs tracking-wide text-muted uppercase">Approved listing</p>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
