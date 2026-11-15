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
  createdAt: string;
  updatedAt: string;
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
