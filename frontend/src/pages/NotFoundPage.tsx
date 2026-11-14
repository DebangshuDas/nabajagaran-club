import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="mx-auto max-w-3xl px-5 py-24 md:px-8">
      <p className="text-xs font-medium tracking-[0.22em] text-gold uppercase">404</p>
      <h1 className="mt-3 font-display text-5xl text-maroon">This page is not part of the club site.</h1>
      <p className="mt-4 text-muted">The address does not match a published page.</p>
      <Link to="/" className="mt-8 inline-flex bg-maroon px-5 py-3 text-sm text-ivory">
        Return home
      </Link>
    </section>
  );
}
