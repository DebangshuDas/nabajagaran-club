import { initiatives } from "../data/site";
import { CtaBand } from "../components/ui/CtaBand";
import { PageHero } from "../components/ui/PageHero";
import { PlaceholderNote } from "../components/ui/PlaceholderNote";
import { PhotoPlaceholder } from "../components/ui/PhotoPlaceholder";

export default function InitiativesPage() {
  return (
    <>
      <PageHero
        bengali="সেবা"
        eyebrow="Community initiatives"
        title="Welfare, ready for the club’s own words."
        lede="Learning, health, relief, and care for neighbours are the kinds of work this page can present. No programme below is listed as already completed or currently open."
        photoLabel="Photograph — community welfare"
        tone="ivory"
      />
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        <PlaceholderNote>
          When the club confirms a drive, replace the card text with what is being offered, who it is
          for, and where people should go. Leave out private member details.
        </PlaceholderNote>
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {initiatives.map((item, index) => (
            <article key={item.title} className="border border-line bg-white">
              <PhotoPlaceholder
                label={`Photograph — ${item.title}`}
                tone={index % 2 === 0 ? "maroon" : "gold"}
                className="min-h-44"
              />
              <div className="p-6">
                <p className="text-xs tracking-[0.18em] text-gold uppercase">Placeholder</p>
                <h2 className="mt-2 font-display text-3xl text-maroon">{item.title}</h2>
                <p className="mt-3 leading-relaxed text-muted">{item.text}</p>
              </div>
            </article>
          ))}
        </div>
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
