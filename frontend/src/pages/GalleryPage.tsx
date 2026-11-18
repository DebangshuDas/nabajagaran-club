import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingState } from "../components/ui/LoadingState";
import { PageHero } from "../components/ui/PageHero";
import { PhotoPlaceholder } from "../components/ui/PhotoPlaceholder";
import { getPublishedGalleryAlbums } from "../services/siteService";
import type { GalleryAlbumResponse } from "../types/api";
import { safeHttpUrl } from "../utils/urls";

export default function GalleryPage() {
  const [albums, setAlbums] = useState<GalleryAlbumResponse[]>([]);
  const [albumCategory, setAlbumCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    getPublishedGalleryAlbums()
      .then((response) => {
        if (active) setAlbums(response);
      })
      .catch(() => {
        if (active) setError("Published gallery content could not be loaded.");
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [refreshKey]);

  const categories = useMemo(
    () => [...new Set(albums.map((item) => item.category?.trim()).filter(
      (category): category is string => Boolean(category),
    ))].sort((left, right) => left.localeCompare(right)),
    [albums],
  );
  const visibleAlbums = albums.filter(
    (item) => albumCategory === "All" || item.category === albumCategory,
  );

  return (
    <>
      <PageHero
        bengali="চিত্র"
        eyebrow="Gallery"
        title="Club gallery"
        lede="Browse photographs published by the club."
        photoLabel="Published club photographs"
        tone="night"
      />
      <section className="mx-auto max-w-6xl px-5 py-16 md:px-8">
        {isLoading ? (
          <LoadingState message="Loading published gallery..." />
        ) : error ? (
          <div className="space-y-4">
            <ErrorState message={error} />
            <button
              className="rounded border border-maroon px-4 py-2 text-sm font-medium text-maroon hover:bg-maroon hover:text-white"
              onClick={() => {
                setIsLoading(true);
                setError(null);
                setRefreshKey((key) => key + 1);
              }}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : albums.length === 0 ? (
          <EmptyState message="There are no published gallery albums yet." />
        ) : (
          <>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Filter gallery">
              {["All", ...categories].map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setAlbumCategory(category)}
                  className={`border px-3 py-2 text-sm transition ${
                    albumCategory === category
                      ? "border-maroon bg-maroon text-ivory"
                      : "border-line bg-white text-ink hover:border-gold"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
            {visibleAlbums.length === 0 ? (
              <div className="mt-8">
                <EmptyState message="There are no published albums in this category." />
              </div>
            ) : (
              <div className="mt-8 space-y-12">
                {visibleAlbums.map((album) => {
                  const cover = safeHttpUrl(album.coverImageUrl);
                  return (
                    <section
                      aria-labelledby={`gallery-album-${album.id}`}
                      className="border-b border-line pb-10 last:border-b-0"
                      key={album.id}
                    >
                      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
                        <div>
                          {album.category && (
                            <p className="text-xs tracking-[0.18em] text-gold uppercase">
                              {album.category}
                            </p>
                          )}
                          <h2
                            className="mt-1 font-display text-3xl text-maroon"
                            id={`gallery-album-${album.id}`}
                          >
                            {album.title}
                          </h2>
                          {album.description && (
                            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted">
                              {album.description}
                            </p>
                          )}
                        </div>
                        <span className="text-sm text-muted">
                          {album.imageCount} {album.imageCount === 1 ? "image" : "images"}
                        </span>
                      </div>
                      {album.images.length === 0 ? (
                        <p className="text-sm text-muted">This album has no published images.</p>
                      ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {album.images.map((image, index) => {
                            const imageUrl = safeHttpUrl(image.imageUrl);
                            return (
                              <figure className="overflow-hidden border border-line bg-white" key={image.id}>
                                {imageUrl ? (
                                  <img
                                    alt={image.altText?.trim() || image.title?.trim() || ""}
                                    className={`w-full object-cover ${
                                      index === 0 && cover === imageUrl
                                        ? "aspect-[16/9]"
                                        : "aspect-[4/3]"
                                    }`}
                                    loading="lazy"
                                    src={imageUrl}
                                  />
                                ) : (
                                  <PhotoPlaceholder
                                    label={image.title || album.title}
                                    className="aspect-[4/3]"
                                  />
                                )}
                                {(image.title || image.caption) && (
                                  <figcaption className="p-4">
                                    {image.title && (
                                      <p className="font-medium text-ink">{image.title}</p>
                                    )}
                                    {image.caption && (
                                      <p className="mt-1 text-sm leading-relaxed text-muted">
                                        {image.caption}
                                      </p>
                                    )}
                                  </figcaption>
                                )}
                              </figure>
                            );
                          })}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}
