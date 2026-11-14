import api from "./api";
import type {
  AnnouncementResponse,
  BusinessResponse,
  ClubDetailsResponse,
  EventResponse,
} from "../types/api";

export async function getClubDetails() {
  const response = await api.get<ClubDetailsResponse>("/club");
  return response.data;
}

export async function getUpcomingEvents() {
  const response = await api.get<EventResponse[]>("/events/upcoming");
  return response.data;
}

export async function getPublishedAnnouncements() {
  const response = await api.get<AnnouncementResponse[]>("/announcements/published");
  return response.data;
}

export async function getApprovedBusinesses() {
  const response = await api.get<BusinessResponse[]>("/businesses/approved");
  return response.data;
}
