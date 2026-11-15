import { PublicFestivalPage } from "../components/festival/PublicFestivalPage";

export default function KaliPujaPage() {
  return (
    <PublicFestivalPage
      slug="kali-puja"
      bengali="কালীপূজা"
      tone="night"
      relatedLink={{ label: "Gallery frames", to: "/gallery" }}
    />
  );
}
