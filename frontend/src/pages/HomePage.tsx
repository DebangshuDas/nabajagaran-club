import { Link, useOutletContext } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import type { SiteLayoutContext } from "../components/layout/SiteLayout";
import { AnnouncementContent } from "../components/ui/AnnouncementContent";
import { CtaBand } from "../components/ui/CtaBand";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { PhotoPlaceholder } from "../components/ui/PhotoPlaceholder";
import { SectionHeading } from "../components/ui/SectionHeading";
import { getHomepage } from "../services/siteService";
import type {
  HomepagePublicContentResponse,
  HomepagePublicResponse,
  HomepageSectionType,
} from "../types/api";

const sectionTitles: Record<HomepageSectionType, { eyebrow: string; title: string }> = {
  EVENTS: { eyebrow: "Calendar", title: "Upcoming gatherings" },
  ANNOUNCEMENTS: { eyebrow: "Latest updates", title: "Announcements" },
  INITIATIVES: { eyebrow: "Community", title: "Community initiatives" },
  FESTIVALS: { eyebrow: "Celebrations", title: "Festivals" },
  FESTIVAL_EDITIONS: { eyebrow: "From the archive", title: "Festival editions" },
  GALLERY_ALBUMS: { eyebrow: "In pictures", title: "Gallery albums" },
};

function isExternalUrl(value: string) {
  return /^https?:\/\//i.test(value);
}

function HomepageLink({
  to,
  className,
  children,
}: {
  to: string;
  className: string;
  children: ReactNode;
}) {
  if (isExternalUrl(to)) {
    return (
      <a className={className} href={to} rel="noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link className={className} to={to}>
      {children}
    </Link>
  );
}

function FeaturedCard({ item }: { item: HomepagePublicContentResponse }) {
  return (
    <article className="flex h-full flex-col border border-line bg-white transition duration-300 hover:-translate-y-1 hover:border-gold">
      {item.imageUrl && (
        <img
          alt=""
          className="h-48 w-full object-cover"
          loading="lazy"
          src={item.imageUrl}
        />
      )}
      <div className="flex flex-1 flex-col p-6">
        {item.detail && (
          <p className="text-[11px] font-medium tracking-[0.18em] text-gold uppercase">
            {item.detail}
          </p>
        )}
        <h3 className="mt-2 font-display text-3xl text-maroon">{item.title}</h3>
        {item.summary && (
          <p className="mt-3 flex-1 leading-relaxed text-muted">{item.summary}</p>
        )}
        <HomepageLink
          className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-maroon underline-offset-4 hover:underline"
          to={item.url}
        >
          Explore
          <ArrowRight className="size-4" aria-hidden="true" />
        </HomepageLink>
      </div>
    </article>
  );
}

function HomepageSection({
  type,
  items,
}: {
  type: HomepageSectionType;
  items: HomepagePublicContentResponse[];
}) {
  const heading = sectionTitles[type];
  return (
    <section
      className="mx-auto max-w-6xl px-5 py-20 md:px-8"
      id={type === "ANNOUNCEMENTS" ? "announcements" : undefined}
    >
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <SectionHeading
          eyebrow={heading.eyebrow}
          title={heading.title}
          text={
            type === "ANNOUNCEMENTS"
              ? "Public notices and updates from the club."
              : type === "EVENTS"
                ? "Gatherings and programmes selected by the club."
                : "Selected stories and programmes from the club."
          }
        />
        {type === "EVENTS" && (
          <Link
            className="text-sm font-medium text-maroon underline-offset-4 hover:underline"
            to="/events"
          >
            All events
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <div className="mt-8">
          <EmptyState message="There is no published content in this section yet." />
        </div>
      ) : type === "ANNOUNCEMENTS" ? (
        <ul className="mt-8 space-y-4">
          {items.map((item) => (
            <li key={item.id} className="border border-line bg-white p-5">
              {item.detail && (
                <p className="text-[11px] font-medium tracking-[0.18em] text-gold uppercase">
                  {item.detail}
                </p>
              )}
              <h3 className="mt-2 font-display text-3xl text-maroon">{item.title}</h3>
              {item.summary && (
                <AnnouncementContent
                  className="mt-3 space-y-2 text-sm leading-relaxed text-muted"
                  content={item.summary}
                />
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => <FeaturedCard item={item} key={`${type}-${item.id}`} />)}
        </div>
      )}
    </section>
  );
}

export default function HomePage() {
  const { club, clubError } = useOutletContext<SiteLayoutContext>();
  const [homepage, setHomepage] = useState<HomepagePublicResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getHomepage()
      .then((response) => {
        if (isMounted) setHomepage(response);
      })
      .catch((loadError: unknown) => {
        if (isMounted) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Unable to load homepage content right now. Please try again later.",
          );
        }
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <LoadingState message="Loading homepage..." />
      </div>
    );
  }

  if (error || !homepage) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <ErrorState message={error ?? "Homepage content is unavailable."} />
      </div>
    );
  }

  return (
    <>
      <section className="relative overflow-hidden bg-maroon-dark text-ivory">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-[1.05fr_0.95fr]">
          <div>
            <p className="font-bengali text-xl text-gold">নবজাগরণ</p>
            <h1 className="mt-4 font-display text-5xl leading-[1.02] sm:text-6xl md:text-7xl">
              {homepage.heroTitle}
            </h1>
            {homepage.heroSubtitle && (
              <p className="mt-4 text-lg text-gold">{homepage.heroSubtitle}</p>
            )}
            {club?.description?.trim() && (
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-ivory/80">
                {club.description.trim()}
              </p>
            )}
            {clubError && (
              <p className="mt-4 max-w-lg text-sm text-ivory/70" role="status">
                Club profile information is temporarily unavailable.
              </p>
            )}
            <div className="mt-8 flex flex-wrap gap-3">
              {homepage.ctaText && homepage.ctaUrl && (
                <HomepageLink
                  className="inline-flex items-center gap-2 bg-gold px-5 py-3 text-sm font-medium text-maroon-dark transition hover:bg-gold-soft"
                  to={homepage.ctaUrl}
                >
                  {homepage.ctaText}
                  <ArrowRight className="size-4" aria-hidden="true" />
                </HomepageLink>
              )}
              <Link
                className="inline-flex items-center border border-ivory/30 px-5 py-3 text-sm text-ivory transition hover:border-gold hover:text-gold"
                to="/about"
              >
                About the club
              </Link>
            </div>
          </div>
          {homepage.heroImageUrl ? (
            <img
              alt=""
              className="min-h-[22rem] w-full object-cover md:min-h-[30rem]"
              src={homepage.heroImageUrl}
            />
          ) : (
            <PhotoPlaceholder
              label="Photograph — Bengali cultural gathering"
              tone="maroon"
              className="min-h-[22rem] md:min-h-[30rem]"
            />
          )}
        </div>
      </section>

      {homepage.sections
        .filter((section) => section.visible)
        .slice()
        .sort((left, right) => left.displayOrder - right.displayOrder)
        .map((section) => (
          <HomepageSection
            key={section.type}
            type={section.type}
            items={section.items}
          />
        ))}

      <CtaBand
        title="Take a place in the club’s public life."
        text="Membership details, including any contribution, will be confirmed by the club."
        action="Become a member"
        to="/membership"
      />
    </>
  );
}
