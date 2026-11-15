import { useState } from "react";
import { Link } from "react-router-dom";
import type { FestivalPublicSummaryResponse } from "../../types/api";
import { PhotoPlaceholder } from "../ui/PhotoPlaceholder";

const dateFormatter = new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" });

function formatDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : dateFormatter.format(date);
}

function festivalPath(slug: string) {
  if (slug === "durga-puja" || slug === "kali-puja") return `/${slug}`;
  return `/festivals/${encodeURIComponent(slug)}`;
}

export function FestivalCard({ festival }: { festival: FestivalPublicSummaryResponse }) {
  const [imageFailed, setImageFailed] = useState(false);
  const edition = festival.latestEdition;
  const editionDates = edition
    ? [formatDate(edition.startDate), formatDate(edition.endDate)].filter(Boolean)
    : [];
  const dateLabel = editionDates.length === 2
    ? editionDates[0] === editionDates[1]
      ? editionDates[0]
      : `${editionDates[0]} – ${editionDates[1]}`
    : editionDates[0];
  const editionDetails = edition
    ? [edition.year, edition.theme, dateLabel].filter(Boolean).join(" · ")
    : null;
  const description = festival.description?.trim();

  return (
    <article className="overflow-hidden border border-line bg-white">
      <Link
        aria-label={`View ${festival.name}`}
        className="block focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-maroon"
        to={festivalPath(festival.slug)}
      >
        {festival.coverImageUrl && !imageFailed ? (
          <img
            alt=""
            className="aspect-[16/9] w-full object-cover"
            onError={() => setImageFailed(true)}
            src={festival.coverImageUrl}
          />
        ) : (
          <PhotoPlaceholder label={festival.name} className="aspect-[16/9]" />
        )}
      </Link>
      <div className="p-5">
        <p className="text-xs font-medium tracking-[0.18em] text-gold uppercase">Festival</p>
        <h2 className="mt-2 font-display text-2xl text-maroon">{festival.name}</h2>
        {description && (
          <p className="mt-3 text-sm leading-relaxed text-ink/80">
            {description.length > 180 ? `${description.slice(0, 177).trimEnd()}...` : description}
          </p>
        )}
        {editionDetails && (
          <p className="mt-4 border-t border-line pt-3 text-sm text-muted">
            Latest published edition: {editionDetails}
          </p>
        )}
        <Link
          className="mt-5 inline-flex text-sm font-medium text-maroon underline underline-offset-4"
          to={festivalPath(festival.slug)}
        >
          View Festival
        </Link>
      </div>
    </article>
  );
}
