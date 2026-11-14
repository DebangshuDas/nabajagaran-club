import { useState } from "react";
import { galleryAlbums, galleryItems } from "../data/site";
import { PageHero } from "../components/ui/PageHero";
import { PhotoPlaceholder } from "../components/ui/PhotoPlaceholder";

export default function GalleryPage() {
  const [album, setAlbum] = useState<(typeof galleryAlbums)[number]>("All");
  const visible = galleryItems.filter((item) => album === "All" || item.album === album);

  return (
    <>
      <PageHero
        bengali="চিত্র"
        eyebrow="Gallery"
        title="Frames for photographs still to come."
        lede="Each panel is a labeled placeholder. Swap in a club photograph later and keep the caption beside it."
        photoLabel="Photograph — to be replaced"
        tone="night"
      />
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter gallery">
          {galleryAlbums.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setAlbum(item)}
              className={`border px-3 py-2 text-sm transition ${
                album === item
                  ? "border-maroon bg-maroon text-ivory"
                  : "border-line bg-white text-ink hover:border-gold"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((item, index) => (
            <figure key={item.id} className={index === 0 ? "sm:col-span-2" : undefined}>
              <PhotoPlaceholder
                label={item.label}
                tone={item.tone}
                className={index === 0 ? "min-h-72" : "min-h-56"}
              />
              <figcaption className="mt-3 flex items-baseline justify-between gap-3 text-sm">
                <span className="text-ink">{item.label}</span>
                <span className="text-xs tracking-[0.14em] text-gold uppercase">{item.album}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </>
  );
}
