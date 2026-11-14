import { Link } from "react-router-dom";
import { PageHero } from "../components/ui/PageHero";
import { PlaceholderNote } from "../components/ui/PlaceholderNote";

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
  return (
    <>
      <PageHero
        bengali="পরিচয়"
        eyebrow="About us"
        title="A public home for the club."
        lede="Nabajaran Club is a Bengali cultural and community welfare organization in West Bengal. This page is ready for the club’s own account of its purpose and people."
        photoLabel="Photograph — club gathering"
      />
      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-20 md:px-8 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-5 text-lg leading-relaxed text-ink/90">
          <p>
            The club’s name, place in West Bengal, and twin concerns — Bengali culture and community
            welfare — are the facts this website starts from.
          </p>
          <p>
            A history, a list of office bearers, and a street address are not invented here. When the
            club shares them, they belong in this column.
          </p>
          <PlaceholderNote>
            Do not treat the surrounding pages as a record of past programmes. They show the
            structure the club can fill.
          </PlaceholderNote>
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
