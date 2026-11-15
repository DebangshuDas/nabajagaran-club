import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { getClubDetails } from "../../services/siteService";
import type { ClubDetailsResponse } from "../../types/api";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";

export type SiteLayoutContext = {
  club: ClubDetailsResponse | null;
  clubLoading: boolean;
  clubError: string | null;
};

export function SiteLayout() {
  const { pathname } = useLocation();
  const [club, setClub] = useState<ClubDetailsResponse | null>(null);
  const [clubLoading, setClubLoading] = useState(true);
  const [clubError, setClubError] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  useEffect(() => {
    let isCurrent = true;
    getClubDetails()
      .then((response) => {
        if (isCurrent) setClub(response);
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setClubError(
            error instanceof Error
              ? error.message
              : "Club profile information could not be loaded.",
          );
        }
      })
      .finally(() => {
        if (isCurrent) setClubLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const context: SiteLayoutContext = { club, clubLoading, clubError };

  return (
    <div className="flex min-h-screen flex-col bg-ivory text-ink">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:bg-white focus:px-4 focus:py-2"
      >
        Skip to content
      </a>
      <Navbar clubName={club?.clubName} />
      <main id="content" className="flex-1">
        <Outlet context={context} />
      </main>
      <Footer club={club} />
    </div>
  );
}
