import { useParams } from "react-router-dom";
import { PublicFestivalPage } from "../components/festival/PublicFestivalPage";

export default function FestivalDetailPage() {
  const { slug = "" } = useParams();

  return (
    <PublicFestivalPage
      slug={slug}
      bengali="উৎসব"
      tone="maroon"
      relatedLink={{ label: "All festivals", to: "/festivals" }}
      generic
    />
  );
}
