import { Link } from "react-router-dom";
import { navItems } from "../../data/site";

const socialNames = ["Facebook", "Instagram", "YouTube"];

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-maroon-dark text-ivory">
      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-2 md:px-8 lg:grid-cols-4">
        <div>
          <p className="font-bengali text-gold">নবজাগরণ</p>
          <p className="mt-2 font-display text-3xl">Nabajaran Club</p>
          <p className="mt-4 text-sm leading-relaxed text-ivory/75">
            A Bengali cultural and community welfare organization in West Bengal, India.
          </p>
        </div>

        <div>
          <h2 className="text-xs font-medium tracking-[0.2em] text-gold uppercase">Visit</h2>
          <p className="mt-4 text-sm leading-relaxed text-ivory/75">
            West Bengal, India.
            <br />
            Street address, phone, and email will be added when the club shares them.
          </p>
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
            {socialNames.map((name) => (
              <li key={name}>
                {name}
                <span className="block text-xs text-ivory/50">Link to be added</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-ivory/10">
        <p className="mx-auto max-w-6xl px-5 py-5 text-xs text-ivory/60 md:px-8">
          © {year} Nabajaran Club. Programme text on this site is placeholder copy until the club publishes its own.
        </p>
      </div>
    </footer>
  );
}
