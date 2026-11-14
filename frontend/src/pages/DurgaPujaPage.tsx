import { Link } from "react-router-dom";
import { FestivalLayout } from "../components/ui/FestivalLayout";

export default function DurgaPujaPage() {
  return (
    <FestivalLayout
      bengali="দুর্গাপূজা"
      title="Durga Puja"
      lede="Sharad Durga Puja is the autumn festival at the heart of Bengali public life. This page is where Nabajaran Club can publish its own gathering."
      photoLabel="Photograph — Durga Puja"
      tone="maroon"
      aboutTitle="The festival, and the club’s still-open programme."
      about={[
        "Durga Puja marks the homecoming of Goddess Durga and fills neighbourhoods with pandals, dhaki, and shared meals. That is the wider cultural setting. It is not a description of a Nabajaran Club event already held.",
        "When the club is ready, this page should carry the dates, the gathering place, the daily schedule, and how neighbours can help. None of those details are available yet, so they are not guessed.",
      ]}
      moments={[
        { title: "Dates", text: "To be announced by the club." },
        { title: "Venue", text: "To be announced by the club." },
        { title: "Participation", text: "Volunteer notes will be added here." },
      ]}
      aside={
        <>
          <p className="text-xs font-medium tracking-[0.18em] text-maroon uppercase">This year</p>
          <h2 className="mt-3 font-display text-3xl text-maroon">Programme not published</h2>
          <p className="mt-3 text-sm leading-relaxed text-ink/80">
            There is no confirmed Nabajaran Club Durga Puja schedule on this website yet.
          </p>
          <Link to="/events" className="mt-6 inline-flex text-sm font-medium text-maroon underline">
            Back to events
          </Link>
        </>
      }
    />
  );
}
