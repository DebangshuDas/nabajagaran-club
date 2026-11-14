export type PhotoTone = "maroon" | "night" | "gold" | "ivory";

export type NavItem = {
  label: string;
  to: string;
};

export type Activity = {
  index: string;
  title: string;
  text: string;
  to: string;
};

export type ClubEvent = {
  title: string;
  season: string;
  when: string;
  summary: string;
  to: string;
};

export type Initiative = {
  title: string;
  text: string;
};

export type BusinessListing = {
  name: string;
  category: string;
  area: string;
  note: string;
};

export type GalleryItem = {
  id: string;
  album: string;
  label: string;
  tone: PhotoTone;
};

export const navItems: NavItem[] = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Events", to: "/events" },
  { label: "Durga Puja", to: "/durga-puja" },
  { label: "Kali Puja", to: "/kali-puja" },
  { label: "Initiatives", to: "/initiatives" },
  { label: "Directory", to: "/directory" },
  { label: "Gallery", to: "/gallery" },
  { label: "Contact", to: "/contact" },
];

export const activities: Activity[] = [
  {
    index: "01",
    title: "Durga Puja",
    text: "A page for the club’s Sharad gathering: the programme, the gathering place, and ways to take part.",
    to: "/durga-puja",
  },
  {
    index: "02",
    title: "Kali Puja",
    text: "A quieter, night-time companion page for Kali Puja, ready for the club’s own schedule.",
    to: "/kali-puja",
  },
  {
    index: "03",
    title: "Community welfare",
    text: "Space for learning support, health camps, and other care the club chooses to organise.",
    to: "/initiatives",
  },
  {
    index: "04",
    title: "Local directory",
    text: "A place to introduce neighbourhood businesses once each listing is confirmed.",
    to: "/directory",
  },
];

export const events: ClubEvent[] = [
  {
    title: "Sharad Durga Puja",
    season: "Autumn",
    when: "Dates to be announced",
    summary:
      "Sample listing for the club’s Durga Puja. The venue and daily schedule will be published by the club.",
    to: "/durga-puja",
  },
  {
    title: "Kali Puja",
    season: "Autumn",
    when: "Dates to be announced",
    summary:
      "Sample listing for Kali Puja. Lighting, cultural items, and gathering details are still to be added.",
    to: "/kali-puja",
  },
  {
    title: "Community welfare day",
    season: "Open date",
    when: "Date to be announced",
    summary:
      "Sample listing for a welfare gathering. The kind of support, and where it happens, will come from the club.",
    to: "/initiatives",
  },
  {
    title: "Cultural evening",
    season: "Open date",
    when: "Date to be announced",
    summary:
      "Sample listing for music, recitation, or theatre. Performers and timing are not confirmed.",
    to: "/events",
  },
];

export const initiatives: Initiative[] = [
  {
    title: "Learning support",
    text: "A card ready for tuition circles, book sharing, or exam-season help, once the club describes the work.",
  },
  {
    title: "Health camps",
    text: "A card ready for check-ups or health awareness sessions. No camp is listed as scheduled.",
  },
  {
    title: "Relief coordination",
    text: "A card ready for flood, winter, or festival relief. Collection points are not published yet.",
  },
  {
    title: "Neighbourhood care",
    text: "A card ready for visits, rations, or support for elders. Names and addresses are intentionally absent.",
  },
];

export const businesses: BusinessListing[] = [
  {
    name: "Sample listing — provisions",
    category: "Daily needs",
    area: "Locality to be confirmed",
    note: "Placeholder for a neighbourhood shop. Phone numbers are omitted until the business confirms them.",
  },
  {
    name: "Sample listing — tailoring",
    category: "Craft",
    area: "Locality to be confirmed",
    note: "Placeholder for a tailor or weaver the club may wish to introduce.",
  },
  {
    name: "Sample listing — food",
    category: "Food",
    area: "Locality to be confirmed",
    note: "Placeholder for a sweet shop, tiffin service, or home kitchen.",
  },
  {
    name: "Sample listing — books",
    category: "Culture",
    area: "Locality to be confirmed",
    note: "Placeholder for a bookstall, stationery shop, or music teacher.",
  },
  {
    name: "Sample listing — services",
    category: "Services",
    area: "Locality to be confirmed",
    note: "Placeholder for a clinic, repair shop, or coaching class.",
  },
  {
    name: "Sample listing — celebration",
    category: "Celebration",
    area: "Locality to be confirmed",
    note: "Placeholder for decorators, florists, or puja suppliers.",
  },
];

export const galleryItems: GalleryItem[] = [
  { id: "durga-1", album: "Durga Puja", label: "Photograph — Durga Puja pandal", tone: "maroon" },
  { id: "durga-2", album: "Durga Puja", label: "Photograph — evening lights", tone: "gold" },
  { id: "kali-1", album: "Kali Puja", label: "Photograph — Kali Puja night", tone: "night" },
  { id: "kali-2", album: "Kali Puja", label: "Photograph — diyas", tone: "ivory" },
  { id: "welfare-1", album: "Welfare", label: "Photograph — community gathering", tone: "maroon" },
  { id: "welfare-2", album: "Welfare", label: "Photograph — shared meal", tone: "gold" },
  { id: "culture-1", album: "Culture", label: "Photograph — recitation or music", tone: "night" },
  { id: "culture-2", album: "Culture", label: "Photograph — neighbourhood street", tone: "ivory" },
];

export const galleryAlbums = ["All", "Durga Puja", "Kali Puja", "Welfare", "Culture"] as const;
