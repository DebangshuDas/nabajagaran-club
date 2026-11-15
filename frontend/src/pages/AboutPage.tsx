import { Link, useOutletContext } from "react-router-dom";
import { PageHero } from "../components/ui/PageHero";
import type { SiteLayoutContext } from "../components/layout/SiteLayout";

const roles = [
  {
    title: "Cultural gatherings",
    text: "Pages for Durga Puja, Kali Puja, and other programmes the club chooses to announce.",
  },
  {
    title: "Community welfare",
    text: "A section for learning, health, and relief, written only when the club describes the work.",
  },
  {
    title: "Local introductions",
    text: "A directory for neighbourhood businesses, published after each listing is confirmed.",
  },
];

export default function AboutPage() {
  const { club, clubLoading, clubError } = useOutletContext<SiteLayoutContext>();
  const clubName = club?.clubName?.trim() || "About the club";
  const tagline = club?.tagline?.trim();
  const description = club?.description?.trim();
  const mission = club?.mission?.trim();

  return (
    <>
      <PageHero
        bengali="পরিচয়"
        eyebrow="About us"
        title={clubName}
        lede={tagline || "Club profile information."}
        photoLabel="Photograph — club gathering"
      />
      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:px-8 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-5 text-lg leading-relaxed text-ink/90">
          {clubLoading ? (
            <p role="status">Loading club profile...</p>
          ) : clubError ? (
            <p role="status">Club profile information is temporarily unavailable.</p>
          ) : (
            <>
              {description && <p>{description}</p>}
              {mission && (
                <div>
                  <h2 className="font-display text-3xl text-maroon">Our Mission</h2>
                  <p className="mt-2">{mission}</p>
                </div>
              )}
              {club?.foundedYear && (
                <p className="text-base text-muted">Founded in {club.foundedYear}.</p>
              )}
              {!description && !mission && !club?.foundedYear && (
                <p className="text-base text-muted">Club profile details have not been provided yet.</p>
              )}
            </>
          )}
        </div>
        <div className="grid gap-4">
          {roles.map((role) => (
            <article key={role.title} className="border border-line bg-white p-6">
              <h2 className="font-display text-3xl text-maroon">{role.title}</h2>
              <p className="mt-2 leading-relaxed text-muted">{role.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="border-t border-line bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-16 md:flex-row md:items-center md:justify-between md:px-8">
          <p className="max-w-xl font-display text-3xl text-maroon">
            Read the calendar, or leave a note for the club.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link to="/events" className="bg-maroon px-5 py-3 text-sm text-ivory">
              Events
            </Link>
            <Link to="/contact" className="border border-maroon px-5 py-3 text-sm text-maroon">
              Contact
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
