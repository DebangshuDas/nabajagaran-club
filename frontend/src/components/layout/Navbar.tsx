import { useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { navItems } from "../../data/site";

function linkClass(isActive: boolean) {
  return `text-sm tracking-wide transition hover:text-maroon ${
    isActive ? "text-maroon" : "text-ink/80"
  }`;
}

export function Navbar() {
  const { pathname } = useLocation();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const open = openPath === pathname;

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ivory/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-4 md:px-8">
        <Link to="/" className="min-w-0">
          <span className="block font-bengali text-sm leading-none text-gold">নবজাগরণ</span>
          <span className="mt-1 block font-display text-2xl leading-none text-maroon">
            nabajagaran-club
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link
            to="/membership"
            className="hidden bg-maroon px-4 py-2 text-sm font-medium text-ivory transition hover:bg-maroon-dark sm:inline-flex"
          >
            Become a member
          </Link>
          <button
            type="button"
            className="inline-flex size-11 items-center justify-center border border-line text-maroon lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpenPath(open ? null : pathname)}
          >
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
            {open ? <X className="size-5" aria-hidden="true" /> : <Menu className="size-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <nav className="mx-auto hidden max-w-6xl gap-x-5 gap-y-2 px-8 pb-4 lg:flex lg:flex-wrap" aria-label="Primary">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) => linkClass(isActive)}
          >
            {item.label}
          </NavLink>
        ))}
      </nav>

      {open ? (
        <nav id="mobile-nav" className="border-t border-line bg-ivory px-5 py-4 lg:hidden" aria-label="Mobile">
          <ul className="grid gap-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `block px-2 py-3 text-base ${isActive ? "text-maroon" : "text-ink"}`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <Link
            to="/membership"
            className="mt-3 inline-flex bg-maroon px-4 py-3 text-sm font-medium text-ivory sm:hidden"
          >
            Become a member
          </Link>
        </nav>
      ) : null}
    </header>
  );
}
