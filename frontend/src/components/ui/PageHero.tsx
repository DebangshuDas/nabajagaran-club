import type { PhotoTone } from "../../data/site";
import { PhotoPlaceholder } from "./PhotoPlaceholder";

type PageHeroProps = {
  bengali?: string;
  eyebrow: string;
  title: string;
  lede: string;
  photoLabel: string;
  tone?: PhotoTone;
};

export function PageHero({
  bengali,
  eyebrow,
  title,
  lede,
  photoLabel,
  tone = "maroon",
}: PageHeroProps) {
  return (
    <section className="border-b border-line bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-14 md:px-8 md:py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          {bengali ? <p className="font-bengali text-lg text-gold">{bengali}</p> : null}
          <p className="mt-3 text-xs font-medium tracking-[0.22em] text-maroon uppercase">{eyebrow}</p>
          <h1 className="mt-3 font-display text-5xl leading-[1.05] text-maroon md:text-6xl">{title}</h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted">{lede}</p>
        </div>
        <PhotoPlaceholder label={photoLabel} tone={tone} className="min-h-64 md:min-h-80" />
      </div>
    </section>
  );
}
