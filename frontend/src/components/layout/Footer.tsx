import { Link } from "react-router-dom";
import { navItems } from "../../data/site";
import type { ClubDetailsResponse } from "../../types/api";
import { safeHttpUrl } from "../../utils/urls";

export function Footer({ club }: { club: ClubDetailsResponse | null }) {
  const year = new Date().getFullYear();
  const clubName = club?.clubName?.trim() || "Nabajagaran Club";
  const description = club?.description?.trim();
  const address = [
    club?.address,
    club?.city,
    club?.state,
    club?.country,
    club?.postalCode,
  ].map((part) => part?.trim()).filter(Boolean).join(", ");
  const phone = club?.phone?.trim();
  const email = club?.email?.trim();
  const facebookUrl = safeHttpUrl(club?.facebookUrl);
  const instagramUrl = safeHttpUrl(club?.instagramUrl);
  const websiteUrl = safeHttpUrl(club?.website);

  return (
    <footer className="bg-maroon-dark text-ivory">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-2 md:px-8 lg:grid-cols-4">
        <div>
          <p className="font-bengali text-gold">নবজাগরণ</p>
          <p className="mt-2 font-display text-3xl">{clubName}</p>
          {description && (
            <p className="mt-4 text-sm leading-relaxed text-ivory/75">{description}</p>
          )}
          {websiteUrl && (
            <a className="mt-3 inline-block text-sm text-ivory/75 underline hover:text-gold" href={websiteUrl} rel="noreferrer" target="_blank">
              Official website
            </a>
          )}
        </div>

        <div>
          <h2 className="text-xs font-medium tracking-[0.2em] text-gold uppercase">Visit</h2>
          <p className="mt-4 text-sm leading-relaxed text-ivory/75">
            {address || "Address not provided."}
          </p>
          {phone && <a className="mt-2 block text-sm text-ivory/75 hover:text-gold" href={`tel:${phone}`}>{phone}</a>}
          {email && <a className="mt-1 block text-sm text-ivory/75 hover:text-gold" href={`mailto:${email}`}>{email}</a>}
        </div>

        <div>
          <h2 className="text-xs font-medium tracking-[0.2em] text-gold uppercase">Explore</h2>
          <ul className="mt-4 grid gap-2 text-sm">
            {navItems.map((item) => (
              <li key={item.to}>
                <Link to={item.to} className="text-ivory/80 transition hover:text-gold">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xs font-medium tracking-[0.2em] text-gold uppercase">Social</h2>
          <ul className="mt-4 grid gap-2 text-sm text-ivory/75">
            <li>
              {facebookUrl
                ? <a href={facebookUrl} rel="noreferrer" target="_blank">Facebook</a>
                : <span>Facebook — Not provided</span>}
            </li>
            <li>
              {instagramUrl
                ? <a href={instagramUrl} rel="noreferrer" target="_blank">Instagram</a>
                : <span>Instagram — Not provided</span>}
            </li>
            <li>
              <span>YouTube</span>
              <span className="block text-xs text-ivory/50">Link not provided</span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <p className="mx-auto max-w-6xl px-5 py-5 text-xs text-ivory/60 md:px-8">
          © {year} {clubName}. Programme text on this site is placeholder copy until the club publishes its own.
        </p>
      </div>
    </footer>
  );
}
