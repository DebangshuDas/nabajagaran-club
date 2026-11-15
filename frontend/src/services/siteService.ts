import api from "./api";
import type {
  AnnouncementResponse,
  BusinessResponse,
  ClubDetailsResponse,
  CommunityInitiativeResponse,
  EventResponse,
  FestivalPublicResponse,
} from "../types/api";

async function getArrayResponse<T>(endpoint: string): Promise<T[]> {
  const response = await api.get<unknown>(endpoint);

  if (!Array.isArray(response.data)) {
    throw new Error(`Invalid API response from ${endpoint}: expected a JSON array.`);
  }

  return response.data;
}

export async function getClubDetails() {
  const response = await api.get<ClubDetailsResponse>("/club");
  return response.data;
}

export async function getUpcomingEvents() {
  return getArrayResponse<EventResponse>("/events/upcoming");
}

export async function getPublishedInitiatives() {
  return getArrayResponse<CommunityInitiativeResponse>("/initiatives/published");
}

export async function getPublishedAnnouncements() {
  return getArrayResponse<AnnouncementResponse>("/announcements/published");
}

export async function getApprovedBusinesses() {
  return getArrayResponse<BusinessResponse>("/businesses/approved");
}

export async function getPublicFestival(slug: string) {
  const response = await api.get<FestivalPublicResponse>(
    `/festivals/${encodeURIComponent(slug)}`,
  );
  return response.data;
}
