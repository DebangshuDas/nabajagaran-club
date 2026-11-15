import api from "./api";
import type {
  AdminDashboardResponse,
  AdminAnnouncementPageResponse,
  AdminAnnouncementQuery,
  AdminEventPageResponse,
  AdminEventQuery,
  AnnouncementCreateRequest,
  AnnouncementResponse,
  AnnouncementUpdateRequest,
  EventRequest,
  EventResponse,
} from "../types/api";

export async function getAnnouncements(
  authorization: string,
  query: AdminAnnouncementQuery,
) {
  const response = await api.get<AdminAnnouncementPageResponse>("/admin/announcements", {
    headers: { Authorization: authorization },
    params: query,
  });
  return response.data;
}

export async function getAnnouncementById(authorization: string, id: number) {
  const response = await api.get<AnnouncementResponse>(`/admin/announcements/${id}`, {
    headers: { Authorization: authorization },
  });
  return response.data;
}

export async function createAnnouncement(
  authorization: string,
  request: AnnouncementCreateRequest,
) {
  const response = await api.post<AnnouncementResponse>("/admin/announcements", request, {
    headers: { Authorization: authorization },
  });
  return response.data;
}

export async function updateAnnouncement(
  authorization: string,
  id: number,
  request: AnnouncementUpdateRequest,
) {
  const response = await api.put<AnnouncementResponse>(`/admin/announcements/${id}`, request, {
    headers: { Authorization: authorization },
  });
  return response.data;
}

export async function publishAnnouncement(authorization: string, id: number) {
  const response = await api.patch<AnnouncementResponse>(
    `/admin/announcements/${id}/publish`,
    undefined,
    { headers: { Authorization: authorization } },
  );
  return response.data;
}

export async function unpublishAnnouncement(authorization: string, id: number) {
  const response = await api.patch<AnnouncementResponse>(
    `/admin/announcements/${id}/unpublish`,
    undefined,
    { headers: { Authorization: authorization } },
  );
  return response.data;
}

export async function deleteAnnouncement(authorization: string, id: number) {
  await api.delete(`/admin/announcements/${id}`, {
    headers: { Authorization: authorization },
  });
}

export async function getAdminDashboard(authorization: string) {
  const response = await api.get<AdminDashboardResponse>("/admin/dashboard", {
    headers: { Authorization: authorization },
  });
  return response.data;
}

export async function getAdminEvents(authorization: string, query: AdminEventQuery) {
  const response = await api.get<AdminEventPageResponse>("/admin/events", {
    headers: { Authorization: authorization },
    params: {
      search: query.search,
      status: query.status || undefined,
      published: query.published,
      page: query.page,
      size: query.size,
    },
  });
  return response.data;
}

export async function getAdminEvent(authorization: string, id: number) {
  const response = await api.get<EventResponse>(`/admin/events/${id}`, {
    headers: { Authorization: authorization },
  });
  return response.data;
}

export async function createAdminEvent(authorization: string, request: EventRequest) {
  const response = await api.post<EventResponse>("/admin/events", request, {
    headers: { Authorization: authorization },
  });
  return response.data;
}

export async function updateAdminEvent(authorization: string, id: number, request: EventRequest) {
  const response = await api.put<EventResponse>(`/admin/events/${id}`, request, {
    headers: { Authorization: authorization },
  });
  return response.data;
}

export async function publishAdminEvent(authorization: string, id: number) {
  const response = await api.patch<EventResponse>(`/admin/events/${id}/publish`, undefined, {
    headers: { Authorization: authorization },
  });
  return response.data;
}

export async function unpublishAdminEvent(authorization: string, id: number) {
  const response = await api.patch<EventResponse>(`/admin/events/${id}/unpublish`, undefined, {
    headers: { Authorization: authorization },
  });
  return response.data;
}

export async function deleteAdminEvent(authorization: string, id: number) {
  await api.delete(`/admin/events/${id}`, {
    headers: { Authorization: authorization },
  });
}
