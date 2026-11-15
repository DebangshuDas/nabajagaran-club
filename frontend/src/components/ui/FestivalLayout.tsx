import { useState, type ReactNode } from "react";
import type { PhotoTone } from "../../data/site";
import { PhotoPlaceholder } from "./PhotoPlaceholder";

type Moment = {
  title: string;
  text: string;
};

type FestivalLayoutProps = {
  bengali: string;
  title: string;
  lede?: string;
  photoLabel: string;
  tone: PhotoTone;
  aboutTitle: string;
  about: string[];
  moments: Moment[];
  aside: ReactNode;
  coverImageUrl?: string | null;
  showAbout?: boolean;
  showAside?: boolean;
  children?: ReactNode;
};

export function FestivalLayout({
  bengali,
  title,
  lede,
  photoLabel,
  tone,
  aboutTitle,
  about,
  moments,
  aside,
  coverImageUrl,
  showAbout = true,
  showAside = true,
  children,
}: FestivalLayoutProps) {
  const [failedCoverUrl, setFailedCoverUrl] = useState<string | null>(null);
  const showCoverImage = Boolean(coverImageUrl && coverImageUrl !== failedCoverUrl);

  return (
    <>
      <section className={tone === "night" ? "bg-[#140d10] text-ivory" : "bg-maroon text-ivory"}>
        <div className="mx-auto grid max-w-6xl gap-10 px-5 py-16 md:px-8 md:py-24 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="font-bengali text-xl text-gold">{bengali}</p>
            <h1 className="mt-4 font-display text-5xl leading-[1.05] md:text-6xl">{title}</h1>
            {lede && <p className="mt-5 max-w-xl text-lg leading-relaxed text-ivory/80">{lede}</p>}
          </div>
          {showCoverImage ? (
            <div className="relative min-h-80 overflow-hidden bg-maroon-dark">
              <img
                alt={photoLabel}
                className="absolute inset-0 size-full object-cover"
                onError={() => setFailedCoverUrl(coverImageUrl ?? null)}
                src={coverImageUrl ?? undefined}
              />
              <div className="absolute inset-0 bg-black/25" />
              <p className="absolute right-6 bottom-5 left-6 font-display text-xl text-ivory sm:text-2xl">
                {photoLabel}
              </p>
            </div>
          ) : (
            <PhotoPlaceholder label={photoLabel} tone={tone} className="min-h-80" />
          )}
        </div>
      </section>
      {(showAbout || showAside) && (
        <section
          className={`mx-auto grid max-w-6xl gap-12 px-5 py-20 md:px-8 ${
            showAbout && showAside ? "lg:grid-cols-[1.2fr_0.8fr]" : ""
          }`}
        >
          {showAbout && (
            <div>
              <h2 className="font-display text-4xl text-maroon">{aboutTitle}</h2>
              <div className="mt-6 space-y-4 leading-relaxed text-ink/90">
                {about.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
              {moments.length > 0 && (
                <div className="mt-10 grid gap-4 sm:grid-cols-3">
                  {moments.map((moment) => (
                    <article key={moment.title} className="border border-line bg-white p-5">
                      <h3 className="font-display text-2xl text-maroon">{moment.title}</h3>
                      <p className="mt-2 text-sm leading-relaxed text-muted">{moment.text}</p>
                    </article>
                  ))}
                </div>
              )}
            </div>
          )}
          {showAside && <aside className="h-fit border border-gold/40 bg-gold-soft/40 p-6">{aside}</aside>}
        </section>
      )}
      {children}
    </>
  );
}
