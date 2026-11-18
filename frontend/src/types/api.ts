export interface ClubDetailsResponse {
  id: number;
  clubName: string;
  tagline?: string | null;
  description?: string | null;
  mission?: string | null;
  foundedYear?: number | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  facebookUrl?: string | null;
  instagramUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ClubProfileUpdateRequest {
  clubName: string;
  tagline: string | null;
  description: string | null;
  mission: string | null;
  foundedYear: number | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postalCode: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  facebookUrl: string | null;
  instagramUrl: string | null;
}

export interface EventResponse {
  id: number;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string | null;
  eventType: string;
  status: EventStatus;
  startAt: string;
  endAt?: string | null;
  venue?: string | null;
  address?: string | null;
  published: boolean;
  capacity?: number | null;
  imageUrl?: string | null;
  galleryImages: GalleryImageResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface GalleryImageResponse {
  id: number;
  albumId: number;
  title?: string | null;
  caption?: string | null;
  altText?: string | null;
  imageUrl: string;
  displayOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryAlbumResponse {
  id: number;
  title: string;
  description?: string | null;
  category?: string | null;
  coverImageUrl?: string | null;
  eventId?: number | null;
  eventTitle?: string | null;
  initiativeId?: number | null;
  initiativeTitle?: string | null;
  festivalEditionId?: number | null;
  festivalName?: string | null;
  editionYear?: number | null;
  published: boolean;
  imageCount: number;
  images: GalleryImageResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminGalleryAlbumPageResponse {
  content: GalleryAlbumResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export type GalleryAssociationType = "EVENT" | "INITIATIVE" | "FESTIVAL_EDITION";

export interface GalleryAssociationOptionResponse {
  type: GalleryAssociationType;
  id: number;
  label: string;
  detail?: string | null;
}

export interface AdminGalleryAssociationPageResponse {
  content: GalleryAssociationOptionResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface GalleryAlbumRequest {
  title: string;
  description: string | null;
  category: string | null;
  coverImageId: number | null;
  eventId: number | null;
  initiativeId: number | null;
  festivalEditionId: number | null;
  published: boolean;
}

export interface GalleryImageMetadataRequest {
  albumId: number;
  title: string | null;
  caption: string | null;
  altText: string | null;
  displayOrder: number;
  published: boolean;
}

export interface GalleryImageOrderRequest {
  imageIds: number[];
}

export type EventStatus = "UPCOMING" | "ONGOING" | "COMPLETED";

export interface EventRequest {
  title: string;
  shortDescription: string | null;
  description: string;
  eventType: string;
  status: EventStatus;
  startAt: string;
  endAt: string | null;
  venue: string | null;
  address: string | null;
  capacity: number | null;
  imageUrl: string | null;
  published: boolean;
}

export type InitiativeStatus = "PLANNED" | "ACTIVE" | "COMPLETED";

export interface InitiativeEventResponse {
  id: number;
  title: string;
  slug: string;
  startAt: string;
  status: EventStatus;
  published: boolean;
}

export interface CommunityInitiativeResponse {
  id: number;
  title: string;
  slug: string;
  category?: string | null;
  shortDescription?: string | null;
  description: string;
  imageUrl?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  location?: string | null;
  status: InitiativeStatus;
  published: boolean;
  relatedEvents: InitiativeEventResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CommunityInitiativeRequest {
  title: string;
  slug: string;
  category: string | null;
  shortDescription: string | null;
  description: string;
  imageUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  location: string | null;
  status: InitiativeStatus;
  published: boolean;
  relatedEventIds: number[];
}

export interface AdminCommunityInitiativePageResponse {
  content: CommunityInitiativeResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminCommunityInitiativeQuery {
  search: string;
  category: string;
  status: InitiativeStatus | "";
  published: boolean | undefined;
  page: number;
  size: number;
}

export interface AdminEventPageResponse {
  content: EventResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminEventQuery {
  search: string;
  status: EventStatus | "";
  published: boolean | undefined;
  page: number;
  size: number;
}

export interface AnnouncementResponse {
  id: number;
  title: string;
  content: string;
  published: boolean;
  publishedAt?: string | null;
  audience?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminAnnouncementPageResponse {
  content: AnnouncementResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminAnnouncementQuery {
  search: string;
  published: boolean | undefined;
  audience: string;
  page: number;
  size: number;
  sort: "createdAt,desc" | "createdAt,asc" | "publishedAt,desc" | "publishedAt,asc";
}

export interface AnnouncementCreateRequest {
  title: string;
  content: string;
  audience: string | null;
  publishImmediately: boolean;
}

export interface AnnouncementUpdateRequest {
  title: string;
  content: string;
  audience: string | null;
}

export interface BusinessResponse {
  id: number;
  name: string;
  slug: string;
  categoryName?: string | null;
  description?: string | null;
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  approvalStatus: string;
  featured: boolean;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdminDashboardResponse {
  upcomingEvents: number;
  publishedAnnouncements: number;
  approvedBusinesses: number;
  events: EventResponse[];
  announcements: AnnouncementResponse[];
}

export interface FestivalResponse {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  history?: string | null;
  coverImageUrl?: string | null;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FestivalRequest {
  name: string;
  slug: string;
  description: string | null;
  history: string | null;
  coverImageUrl: string | null;
  published: boolean;
}

export interface FestivalEditionResponse {
  id: number;
  festivalId: number;
  festivalName: string;
  year: number;
  theme?: string | null;
  description?: string | null;
  featuredHighlights?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  venue?: string | null;
  address?: string | null;
  published: boolean;
  events: FestivalAssociationOptionResponse[];
  galleryImages: FestivalAssociationOptionResponse[];
  sponsors: FestivalAssociationOptionResponse[];
  programmes: FestivalProgrammeResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface FestivalProgrammeResponse {
  id: number;
  festivalEditionId: number;
  festivalYear: number;
  title: string;
  description?: string | null;
  programmeDate: string;
  startTime: string;
  endTime?: string | null;
  venue?: string | null;
  displayOrder: number;
  published: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface FestivalProgrammeRequest {
  title: string;
  description: string | null;
  programmeDate: string;
  startTime: string;
  endTime: string | null;
  venue: string | null;
  displayOrder: number;
  published: boolean;
}

export interface FestivalProgrammeReorderRequest {
  programmeDate: string;
  programmeIds: number[];
}

export interface FestivalEditionRequest {
  year: number;
  theme: string | null;
  description: string | null;
  featuredHighlights: string | null;
  startDate: string | null;
  endDate: string | null;
  venue: string | null;
  address: string | null;
  published: boolean;
  eventIds: number[];
  galleryImageIds: number[];
  sponsorIds: number[];
}

export interface FestivalAssociationOptionResponse {
  id: number;
  label: string;
  detail?: string | null;
  imageUrl?: string | null;
  altText?: string | null;
  startAt?: string | null;
  status: string;
  available: boolean;
}

export type FestivalAssociationType = "EVENT" | "GALLERY_IMAGE" | "SPONSOR";

export interface AdminFestivalPageResponse {
  content: FestivalResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminFestivalEditionPageResponse {
  content: FestivalEditionResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminFestivalAssociationPageResponse {
  content: FestivalAssociationOptionResponse[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface AdminFestivalQuery {
  search: string;
  published: boolean | undefined;
  page: number;
  size: number;
}

export interface FestivalPublicResponse {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  history?: string | null;
  coverImageUrl?: string | null;
  editions: FestivalEditionResponse[];
}

export interface FestivalPublicEditionSummaryResponse {
  id: number;
  year: number;
  theme?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  venue?: string | null;
}

export interface FestivalPublicSummaryResponse {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  coverImageUrl?: string | null;
  latestEdition?: FestivalPublicEditionSummaryResponse | null;
}

export type HomepageSectionType =
  | "EVENTS"
  | "ANNOUNCEMENTS"
  | "INITIATIVES"
  | "FESTIVALS"
  | "FESTIVAL_EDITIONS"
  | "GALLERY_ALBUMS";

export interface HomepagePublicContentResponse {
  type: HomepageSectionType;
  id: string;
  title: string;
  summary?: string | null;
  detail?: string | null;
  imageUrl?: string | null;
  url: string;
}

export interface HomepagePublicSectionResponse {
  type: HomepageSectionType;
  visible: boolean;
  displayOrder: number;
  items: HomepagePublicContentResponse[];
}

export interface HomepagePublicResponse {
  heroTitle: string;
  heroSubtitle?: string | null;
  heroImageUrl?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  sections: HomepagePublicSectionResponse[];
}

export interface HomepageOptionResponse {
  id: string;
  title: string;
  detail?: string | null;
  imageUrl?: string | null;
}

export interface HomepageAdminSectionResponse {
  type: HomepageSectionType;
  visible: boolean;
  displayOrder: number;
  selectedIds: string[];
  options: HomepageOptionResponse[];
}

export interface HomepageAdminResponse {
  heroTitle: string;
  heroSubtitle?: string | null;
  heroImageUrl?: string | null;
  ctaText?: string | null;
  ctaUrl?: string | null;
  updatedAt: string;
  sections: HomepageAdminSectionResponse[];
}

export interface HomepageUpdateSectionRequest {
  type: HomepageSectionType;
  visible: boolean;
  displayOrder: number;
  selectedIds: string[];
}

export interface HomepageUpdateRequest {
  heroTitle: string;
  heroSubtitle: string | null;
  heroImageUrl: string | null;
  ctaText: string | null;
  ctaUrl: string | null;
  sections: HomepageUpdateSectionRequest[];
}
