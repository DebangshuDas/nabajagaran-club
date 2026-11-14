import { useEffect, useState } from "react";
import { EventCard } from "../components/ui/EventCard";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHero } from "../components/ui/PageHero";
import { getUpcomingEvents } from "../services/siteService";
import type { EventResponse } from "../types/api";

export default function EventsPage() {
  const [events, setEvents] = useState<EventResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadEvents() {
      try {
        setLoading(true);
        setError(null);
        const response = await getUpcomingEvents();

        if (!isMounted) return;
        setEvents(response);
      } catch (loadError) {
        if (!isMounted) return;
        setError(
          loadError instanceof Error
            ? loadError.message
            : "Unable to load upcoming events right now."
        );
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadEvents();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      <PageHero
        bengali="অনুষ্ঠান"
        eyebrow="Events"
        title="Upcoming gatherings"
        lede="Festivals and welfare gatherings published by the club are listed here."
        photoLabel="Photograph — festival evening"
        tone="gold"
      />
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        {loading ? (
          <LoadingState message="Loading upcoming events..." />
        ) : error ? (
          <ErrorState message={error} />
        ) : events.length === 0 ? (
          <EmptyState message="No upcoming events are published yet." />
        ) : (
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
