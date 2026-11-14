import { Link } from "react-router-dom";
import { FestivalLayout } from "../components/ui/FestivalLayout";

export default function KaliPujaPage() {
  return (
    <FestivalLayout
      bengali="কালীপূজা"
      title="Kali Puja"
      lede="Kali Puja is observed on the night of Diwali, with lamps, worship of Goddess Kali, and a different rhythm from the days of Durga Puja."
      photoLabel="Photograph — Kali Puja night"
      tone="night"
      aboutTitle="A night festival, with the club’s details still to come."
      about={[
        "Across West Bengal, Kali Puja lights the same night as Diwali. Homes and community pandals keep their own customs. This paragraph describes that shared calendar, not a nabajagaran-club observance.",
        "The club can use this page for its lighting, cultural items, and gathering place. Until those are provided, the page stays open rather than inventing a venue or a time.",
      ]}
      moments={[
        { title: "Night", text: "Date to be announced by the club." },
        { title: "Lighting", text: "Diyas and decor notes can be added." },
        { title: "Gathering", text: "Place to be announced by the club." },
      ]}
      aside={
        <>
          <p className="text-xs font-medium tracking-[0.18em] text-maroon uppercase">This year</p>
          <h2 className="mt-3 font-display text-3xl text-maroon">No confirmed night yet</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/80">
            nabajagaran-club has not published a Kali Puja time or place on this site.
          </p>
          <Link to="/gallery" className="mt-6 inline-flex text-sm font-medium text-maroon underline">
            Gallery frames
          </Link>
        </>
      }
    />
  );
}
