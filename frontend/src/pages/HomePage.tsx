import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";
import { AnnouncementContent } from "../components/ui/AnnouncementContent";
import { CtaBand } from "../components/ui/CtaBand";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { EventCard } from "../components/ui/EventCard";
import { LoadingState } from "../components/ui/LoadingState";
import { PhotoPlaceholder } from "../components/ui/PhotoPlaceholder";
import { SectionHeading } from "../components/ui/SectionHeading";
import {
  getClubDetails,
  getPublishedAnnouncements,
  getUpcomingEvents,
} from "../services/siteService";
import type { AnnouncementResponse, ClubDetailsResponse, EventResponse } from "../types/api";

export default function HomePage() {
  const [club, setClub] = useState<ClubDetailsResponse | null>(null);
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [announcements, setAnnouncements] = useState<AnnouncementResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadHomeData() {
      try {
        setLoading(true);
        setError(null);

        const [clubResponse, eventResponse, announcementResponse] = await Promise.all([
          getClubDetails(),
          getUpcomingEvents(),
          getPublishedAnnouncements(),
        ]);

        if (!isMounted) return;

        setClub(clubResponse);
        setEvents(eventResponse);
        setAnnouncements(announcementResponse);
      } catch (loadError) {
        if (!isMounted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load homepage data right now. Please try again later."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadHomeData();

    return () => {
      isMounted = false;
    };
  }, []);

  const clubName = club?.clubName ?? "nabajagaran-club";
  const clubTagline = club?.tagline ?? "Celebrating culture, community, and belonging";
  const clubDescription =
    club?.description ??
    "A Bengali cultural and community welfare organisation rooted in celebration, learning, and local care.";

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <LoadingState message="Loading club and event information..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <ErrorState message={error} />
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
              {clubName}
            </h1>
            <p className="mt-4 text-lg text-gold">{clubTagline}</p>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-ivory/80">{clubDescription}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/membership"
                className="inline-flex items-center gap-2 bg-gold px-5 py-3 text-sm font-medium text-maroon-dark transition hover:bg-gold-soft"
              >
                Become a member
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                to="/about"
                className="inline-flex items-center border border-ivory/30 px-5 py-3 text-sm text-ivory transition hover:border-gold hover:text-gold"
              >
                About the club
              </Link>
            </div>
          </div>
          <PhotoPlaceholder
            label="Photograph — Bengali cultural gathering"
            tone="maroon"
            className="min-h-[22rem] md:min-h-[30rem]"
          />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <SectionHeading
          eyebrow="Latest updates"
          title="Announcements"
          text="Public notices and updates from the club are displayed here as they are published."
        />
        {announcements.length === 0 ? (
          <div className="mt-8">
            <EmptyState message="There are no published announcements yet." />
          </div>
        ) : (
          <ul className="mt-8 space-y-4">
            {announcements.slice(0, 3).map((announcement) => (
              <li key={announcement.id} className="border border-line bg-white p-5">
                <p className="text-[11px] font-medium tracking-[0.18em] text-gold uppercase">
                  {announcement.audience ?? "Public"}
                </p>
                <h3 className="mt-2 font-display text-3xl text-maroon">{announcement.title}</h3>
                <AnnouncementContent
                  className="mt-3 space-y-2 text-sm leading-relaxed text-muted"
                  content={announcement.content}
                />
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mx-auto max-w-6xl px-5 py-20 md:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            eyebrow="Calendar"
            title="Upcoming gatherings"
            text="The next programmes the club publishes are listed here."
          />
          <Link to="/events" className="text-sm font-medium text-maroon underline-offset-4 hover:underline">
            All events
          </Link>
        </div>
        {events.length === 0 ? (
          <div className="mt-10">
            <EmptyState message="There are no upcoming events published yet." />
          </div>
        ) : (
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {events.slice(0, 3).map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>

      <section className="border-y border-line bg-white">
        <div className="mx-auto max-w-6xl px-5 py-20 md:px-8">
          <SectionHeading
            eyebrow="Featured"
            title="What this site is ready to carry."
            text="Each path below is a real page. The descriptions are placeholders for the club’s own programmes."
          />
          <div className="mt-12 grid gap-px bg-line sm:grid-cols-2">
            {[
              { index: "01", title: "Durga Puja", text: "A page for the club’s Sharad gathering.", to: "/durga-puja" },
              { index: "02", title: "Kali Puja", text: "A quieter night-time communal page.", to: "/kali-puja" },
              { index: "03", title: "Community initiative", text: "Space for learning and welfare work.", to: "/initiatives" },
              { index: "04", title: "Local directory", text: "A place to introduce local businesses.", to: "/directory" },
            ].map((activity) => (
              <Link
                key={activity.title}
                to={activity.to}
                className="group bg-white p-8 transition hover:bg-ivory"
              >
                <span className="font-display text-2xl text-gold">{activity.index}</span>
                <h3 className="mt-6 font-display text-4xl text-maroon transition group-hover:text-maroon-dark">
                  {activity.title}
                </h3>
                <p className="mt-3 max-w-md leading-relaxed text-muted">{activity.text}</p>
                <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-maroon">
                  Explore
                  <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CtaBand
        title="Take a place in the club’s public life."
        text="Membership details, including any contribution, will be confirmed by the club."
        action="Become a member"
        to="/membership"
      />
    </>
  );
}
