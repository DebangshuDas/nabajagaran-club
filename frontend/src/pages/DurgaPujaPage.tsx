import { PublicFestivalPage } from "../components/festival/PublicFestivalPage";

export default function DurgaPujaPage() {
  return (
    <PublicFestivalPage
      slug="durga-puja"
      bengali="দুর্গাপূজা"
      tone="maroon"
      relatedLink={{ label: "Back to events", to: "/events" }}
    />
  );
}
