import api from "./api";
import type {
  AdminDashboardResponse,
  AdminFestivalAssociationPageResponse,
  AdminFestivalEditionPageResponse,
  AdminFestivalPageResponse,
  AdminFestivalQuery,
  AdminCommunityInitiativePageResponse,
  AdminCommunityInitiativeQuery,
  AdminAnnouncementPageResponse,
  AdminAnnouncementQuery,
  AdminEventPageResponse,
  AdminEventQuery,
  AnnouncementCreateRequest,
  AnnouncementResponse,
  AnnouncementUpdateRequest,
  CommunityInitiativeRequest,
  CommunityInitiativeResponse,
  ClubDetailsResponse,
  ClubProfileUpdateRequest,
  EventRequest,
  EventResponse,
  FestivalAssociationType,
  FestivalEditionRequest,
  FestivalEditionResponse,
  FestivalProgrammeRequest,
  FestivalProgrammeResponse,
  FestivalProgrammeReorderRequest,
  FestivalRequest,
  FestivalResponse,
  HomepageAdminResponse,
  HomepageUpdateRequest,
} from "../types/api";

export async function getClubProfile() {
  const response = await api.get<ClubDetailsResponse>("/club");
  return response.data;
}

export async function getAdminHomepage(authorization: string) {
  const response = await api.get<HomepageAdminResponse>("/admin/homepage", {
    headers: { Authorization: authorization },
  });
  return response.data;
}

export async function updateAdminHomepage(
  authorization: string,
  request: HomepageUpdateRequest,
) {
  const response = await api.put<HomepageAdminResponse>("/admin/homepage", request, {
    headers: { Authorization: authorization },
  });
  return response.data;
}

export async function updateClubProfile(
  authorization: string,
  request: ClubProfileUpdateRequest,
) {
  const response = await api.put<ClubDetailsResponse>("/admin/club", request, {
    headers: { Authorization: authorization },
  });
  return response.data;
}

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

export async function getAdminInitiatives(
  authorization: string,
  query: AdminCommunityInitiativeQuery,
) {
  const response = await api.get<AdminCommunityInitiativePageResponse>("/admin/initiatives", {
    headers: { Authorization: authorization },
    params: {
      search: query.search,
      category: query.category || undefined,
      status: query.status || undefined,
      published: query.published,
      page: query.page,
      size: query.size,
    },
  });
  return response.data;
}

export async function getAdminInitiative(authorization: string, id: number) {
  const response = await api.get<CommunityInitiativeResponse>(`/admin/initiatives/${id}`, {
    headers: { Authorization: authorization },
  });
  return response.data;
}

export async function createAdminInitiative(
  authorization: string,
  request: CommunityInitiativeRequest,
) {
  const response = await api.post<CommunityInitiativeResponse>("/admin/initiatives", request, {
    headers: { Authorization: authorization },
  });
  return response.data;
}

export async function updateAdminInitiative(
  authorization: string,
  id: number,
  request: CommunityInitiativeRequest,
) {
  const response = await api.put<CommunityInitiativeResponse>(
    `/admin/initiatives/${id}`,
    request,
    { headers: { Authorization: authorization } },
  );
  return response.data;
}

export async function publishAdminInitiative(authorization: string, id: number) {
  const response = await api.patch<CommunityInitiativeResponse>(
    `/admin/initiatives/${id}/publish`,
    undefined,
    { headers: { Authorization: authorization } },
  );
  return response.data;
}

export async function unpublishAdminInitiative(authorization: string, id: number) {
  const response = await api.patch<CommunityInitiativeResponse>(
    `/admin/initiatives/${id}/unpublish`,
    undefined,
    { headers: { Authorization: authorization } },
  );
  return response.data;
}

export async function deleteAdminInitiative(authorization: string, id: number) {
  await api.delete(`/admin/initiatives/${id}`, {
    headers: { Authorization: authorization },
  });
}

export async function getAdminFestivals(authorization: string, query: AdminFestivalQuery) {
  const response = await api.get<AdminFestivalPageResponse>("/admin/festivals", {
    headers: { Authorization: authorization },
    params: query,
  });
  return response.data;
}

export async function getAdminFestival(authorization: string, id: number) {
  const response = await api.get<FestivalResponse>(`/admin/festivals/${id}`, {
    headers: { Authorization: authorization },
  });
  return response.data;
}

export async function createAdminFestival(authorization: string, request: FestivalRequest) {
  const response = await api.post<FestivalResponse>("/admin/festivals", request, {
    headers: { Authorization: authorization },
  });
  return response.data;
}

export async function updateAdminFestival(
  authorization: string,
  id: number,
  request: FestivalRequest,
) {
  const response = await api.put<FestivalResponse>(`/admin/festivals/${id}`, request, {
    headers: { Authorization: authorization },
  });
  return response.data;
}

export async function publishAdminFestival(authorization: string, id: number) {
  const response = await api.patch<FestivalResponse>(`/admin/festivals/${id}/publish`, undefined, {
    headers: { Authorization: authorization },
  });
  return response.data;
}

export async function unpublishAdminFestival(authorization: string, id: number) {
  const response = await api.patch<FestivalResponse>(
    `/admin/festivals/${id}/unpublish`,
    undefined,
    { headers: { Authorization: authorization } },
  );
  return response.data;
}

export async function deleteAdminFestival(authorization: string, id: number) {
  await api.delete(`/admin/festivals/${id}`, {
    headers: { Authorization: authorization },
  });
}

export async function getAdminFestivalEditions(
  authorization: string,
  festivalId: number,
  page: number,
  size: number,
) {
  const response = await api.get<AdminFestivalEditionPageResponse>(
    `/admin/festivals/${festivalId}/editions`,
    { headers: { Authorization: authorization }, params: { page, size } },
  );
  return response.data;
}

export async function getAdminFestivalEdition(
  authorization: string,
  festivalId: number,
  editionId: number,
) {
  const response = await api.get<FestivalEditionResponse>(
    `/admin/festivals/${festivalId}/editions/${editionId}`,
    { headers: { Authorization: authorization } },
  );
  return response.data;
}

export async function createAdminFestivalEdition(
  authorization: string,
  festivalId: number,
  request: FestivalEditionRequest,
) {
  const response = await api.post<FestivalEditionResponse>(
    `/admin/festivals/${festivalId}/editions`,
    request,
    { headers: { Authorization: authorization } },
  );
  return response.data;
}

export async function updateAdminFestivalEdition(
  authorization: string,
  festivalId: number,
  editionId: number,
  request: FestivalEditionRequest,
) {
  const response = await api.put<FestivalEditionResponse>(
    `/admin/festivals/${festivalId}/editions/${editionId}`,
    request,
    { headers: { Authorization: authorization } },
  );
  return response.data;
}

export async function publishAdminFestivalEdition(
  authorization: string,
  festivalId: number,
  editionId: number,
) {
  const response = await api.patch<FestivalEditionResponse>(
    `/admin/festivals/${festivalId}/editions/${editionId}/publish`,
    undefined,
    { headers: { Authorization: authorization } },
  );
  return response.data;
}

export async function unpublishAdminFestivalEdition(
  authorization: string,
  festivalId: number,
  editionId: number,
) {
  const response = await api.patch<FestivalEditionResponse>(
    `/admin/festivals/${festivalId}/editions/${editionId}/unpublish`,
    undefined,
    { headers: { Authorization: authorization } },
  );
  return response.data;
}

export async function deleteAdminFestivalEdition(
  authorization: string,
  festivalId: number,
  editionId: number,
) {
  await api.delete(`/admin/festivals/${festivalId}/editions/${editionId}`, {
    headers: { Authorization: authorization },
  });
}

export async function getAdminFestivalAssociationOptions(
  authorization: string,
  type: FestivalAssociationType,
  search: string,
  page = 0,
  size = 100,
) {
  const response = await api.get<AdminFestivalAssociationPageResponse>(
    "/admin/festival-associations",
    { headers: { Authorization: authorization }, params: { type, search, page, size } },
  );
  return response.data;
}

export async function getAdminFestivalProgrammes(
  authorization: string,
  festivalId: number,
  editionId: number,
  date?: string,
) {
  const response = await api.get<FestivalProgrammeResponse[]>(
    `/admin/festivals/${festivalId}/editions/${editionId}/programmes`,
    { headers: { Authorization: authorization }, params: { date } },
  );
  return response.data;
}

export async function getAdminFestivalProgramme(
  authorization: string,
  festivalId: number,
  editionId: number,
  programmeId: number,
) {
  const response = await api.get<FestivalProgrammeResponse>(
    `/admin/festivals/${festivalId}/editions/${editionId}/programmes/${programmeId}`,
    { headers: { Authorization: authorization } },
  );
  return response.data;
}

export async function createAdminFestivalProgramme(
  authorization: string,
  festivalId: number,
  editionId: number,
  request: FestivalProgrammeRequest,
) {
  const response = await api.post<FestivalProgrammeResponse>(
    `/admin/festivals/${festivalId}/editions/${editionId}/programmes`,
    request,
    { headers: { Authorization: authorization } },
  );
  return response.data;
}

export async function updateAdminFestivalProgramme(
  authorization: string,
  festivalId: number,
  editionId: number,
  programmeId: number,
  request: FestivalProgrammeRequest,
) {
  const response = await api.put<FestivalProgrammeResponse>(
    `/admin/festivals/${festivalId}/editions/${editionId}/programmes/${programmeId}`,
    request,
    { headers: { Authorization: authorization } },
  );
  return response.data;
}

export async function reorderAdminFestivalProgrammes(
  authorization: string,
  festivalId: number,
  editionId: number,
  request: FestivalProgrammeReorderRequest,
) {
  const response = await api.put<FestivalProgrammeResponse[]>(
    `/admin/festivals/${festivalId}/editions/${editionId}/programmes/order`,
    request,
    { headers: { Authorization: authorization } },
  );
  return response.data;
}

export async function publishAdminFestivalProgramme(
  authorization: string,
  festivalId: number,
  editionId: number,
  programmeId: number,
) {
  const response = await api.patch<FestivalProgrammeResponse>(
    `/admin/festivals/${festivalId}/editions/${editionId}/programmes/${programmeId}/publish`,
    undefined,
    { headers: { Authorization: authorization } },
  );
  return response.data;
}

export async function unpublishAdminFestivalProgramme(
  authorization: string,
  festivalId: number,
  editionId: number,
  programmeId: number,
) {
  const response = await api.patch<FestivalProgrammeResponse>(
    `/admin/festivals/${festivalId}/editions/${editionId}/programmes/${programmeId}/unpublish`,
    undefined,
    { headers: { Authorization: authorization } },
  );
  return response.data;
}

export async function deleteAdminFestivalProgramme(
  authorization: string,
  festivalId: number,
  editionId: number,
  programmeId: number,
) {
  await api.delete(
    `/admin/festivals/${festivalId}/editions/${editionId}/programmes/${programmeId}`,
    { headers: { Authorization: authorization } },
  );
}
