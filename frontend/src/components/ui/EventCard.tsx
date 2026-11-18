import { Link } from "react-router-dom";
import { Calendar } from "lucide-react";
import type { EventResponse } from "../../types/api";

export function EventCard({ event }: { event: EventResponse }) {
  const eventDate = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(event.startAt));

  return (
    <article className="flex h-full flex-col border border-line bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-gold">
      <div className="flex items-center justify-between gap-3 text-[11px] font-medium tracking-[0.18em] uppercase">
        <span className="text-maroon">{event.status}</span>
        <span className="text-muted">{event.eventType}</span>
      </div>
      <h3 className="mt-4 font-display text-3xl text-maroon">{event.title}</h3>
      <p className="mt-3 flex-1 leading-relaxed text-muted">{event.shortDescription || event.description}</p>
      {event.galleryImages.length > 0 && (
        <div className="mt-5 grid grid-cols-3 gap-2" aria-label={`${event.title} gallery`}>
          {event.galleryImages.slice(0, 3).map((image) => (
            <img
              alt={image.altText?.trim() || image.title?.trim() || event.title}
              className="aspect-square w-full object-cover"
              key={image.id}
              loading="lazy"
              src={image.imageUrl}
            />
          ))}
        </div>
      )}
      <p className="mt-6 flex items-center gap-2 text-sm text-ink">
        <Calendar className="size-4 text-gold" aria-hidden="true" />
        {eventDate}
      </p>
      <Link
        to="/events"
        className="mt-4 inline-flex text-sm font-medium text-maroon underline-offset-4 hover:underline"
      >
        Open page
      </Link>
    </article>
  );
}
