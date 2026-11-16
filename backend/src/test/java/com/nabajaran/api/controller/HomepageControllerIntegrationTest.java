package com.nabajaran.api.controller;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Sql("classpath:data.sql")
class HomepageControllerIntegrationTest {

    private static final String ADMIN_AUTHORIZATION = "Basic " + Base64.getEncoder()
            .encodeToString("admin:test-admin-password".getBytes(StandardCharsets.UTF_8));

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @LocalServerPort
    private int port;

    @Test
    void shouldRequireAdminAndRenderSelectedContentInVisibleSectionOrder() throws Exception {
        long eventId = jdbcTemplate.queryForObject(
                "SELECT id FROM events WHERE slug = 'demo-community-welcome-gathering'",
                Long.class);
        long announcementId = jdbcTemplate.queryForObject(
                "SELECT id FROM announcements WHERE title = 'Welcome to the community'",
                Long.class);

        assertThat(send("GET", "/api/v1/admin/homepage", null, false).statusCode()).isEqualTo(401);
        assertThat(send("PUT", "/api/v1/admin/homepage", request(eventId, announcementId, true), false)
                .statusCode()).isEqualTo(401);

        HttpResponse<String> update = send(
                "PUT",
                "/api/v1/admin/homepage",
                request(eventId, announcementId, true),
                true);
        assertThat(update.statusCode()).isEqualTo(200);
        assertThat(update.body()).contains("\"heroTitle\":\"Managed homepage\"");

        HttpResponse<String> publicResponse = send("GET", "/api/v1/homepage", null, false);
        assertThat(publicResponse.statusCode()).isEqualTo(200);
        assertThat(publicResponse.body()).contains("Community Welcome Gathering");
        assertThat(publicResponse.body()).contains("Welcome to the community");
        assertThat(publicResponse.body().indexOf("\"type\":\"ANNOUNCEMENTS\""))
                .isLessThan(publicResponse.body().indexOf("\"type\":\"EVENTS\""));

        HttpResponse<String> hideEvents = send(
                "PUT",
                "/api/v1/admin/homepage",
                request(eventId, announcementId, false),
                true);
        assertThat(hideEvents.statusCode()).isEqualTo(200);

        String hiddenSectionResponse = send("GET", "/api/v1/homepage", null, false).body();
        assertThat(hiddenSectionResponse).doesNotContain("\"type\":\"EVENTS\"");
        assertThat(hiddenSectionResponse).contains("Welcome to the community");
    }

    @Test
    void shouldHideUnpublishedAndDeletedSelectionsAndRejectUnpublishedRecords() throws Exception {
        long eventId = jdbcTemplate.queryForObject(
                "SELECT id FROM events WHERE slug = 'demo-community-welcome-gathering'",
                Long.class);
        long announcementId = jdbcTemplate.queryForObject(
                "SELECT id FROM announcements WHERE title = 'Welcome to the community'",
                Long.class);

        HttpResponse<String> update = send(
                "PUT",
                "/api/v1/admin/homepage",
                request(eventId, announcementId, true),
                true);
        assertThat(update.statusCode()).isEqualTo(200);

        jdbcTemplate.update("UPDATE events SET is_published = FALSE WHERE id = ?", eventId);
        jdbcTemplate.update("UPDATE announcements SET deleted = TRUE WHERE id = ?", announcementId);

        String publicResponse = send("GET", "/api/v1/homepage", null, false).body();
        assertThat(publicResponse).doesNotContain("Community Welcome Gathering");
        assertThat(publicResponse).doesNotContain("Welcome to the community");

        HttpResponse<String> invalidSelection = send(
                "PUT",
                "/api/v1/admin/homepage",
                request(eventId, announcementId, true),
                true);
        assertThat(invalidSelection.statusCode()).isEqualTo(400);
        assertThat(invalidSelection.body()).contains("published content");
    }

    @Test
    void shouldSelectPublishedInitiativesFestivalsEditionsAndGalleryAlbums() throws Exception {
        jdbcTemplate.update(
                "UPDATE community_initiatives SET is_published = TRUE WHERE slug = 'neighborhood-welcome-project'");
        long initiativeId = jdbcTemplate.queryForObject(
                "SELECT id FROM community_initiatives WHERE slug = 'neighborhood-welcome-project'",
                Long.class);

        jdbcTemplate.update("""
                INSERT INTO festivals (
                    name, slug, description, history, cover_image_url, is_published,
                    created_at, updated_at, deleted, deleted_at
                ) VALUES (
                    'Homepage Festival', 'homepage-festival-test', 'Festival description', NULL,
                    '/images/festival.jpg', TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE, NULL
                )
                """);
        long festivalId = jdbcTemplate.queryForObject(
                "SELECT id FROM festivals WHERE slug = 'homepage-festival-test'",
                Long.class);

        jdbcTemplate.update("""
                INSERT INTO festival_editions (
                    festival_id, festival_year, active_year, theme, description, featured_highlights,
                    start_date, end_date, venue, address, is_published, created_at, updated_at,
                    deleted, deleted_at
                ) VALUES (
                    ?, 2032, 2032, 'Shared traditions', 'Edition description', 'Edition highlights',
                    NULL, NULL, 'Community hall', NULL, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
                    FALSE, NULL
                )
                """, festivalId);
        long editionId = jdbcTemplate.queryForObject(
                "SELECT id FROM festival_editions WHERE festival_id = ? AND festival_year = 2032",
                Long.class,
                festivalId);

        long eventId = jdbcTemplate.queryForObject(
                "SELECT id FROM events WHERE slug = 'demo-community-welcome-gathering'",
                Long.class);
        long announcementId = jdbcTemplate.queryForObject(
                "SELECT id FROM announcements WHERE title = 'Welcome to the community'",
                Long.class);
        String selectionRequest = requestAll(
                eventId, announcementId, initiativeId, festivalId, editionId, "community");

        HttpResponse<String> adminResponse = send("GET", "/api/v1/admin/homepage", null, true);
        assertThat(adminResponse.body()).contains("Homepage Festival", "community");

        HttpResponse<String> update = send("PUT", "/api/v1/admin/homepage", selectionRequest, true);
        assertThat(update.statusCode()).isEqualTo(200);
        String publicResponse = send("GET", "/api/v1/homepage", null, false).body();
        assertThat(publicResponse).contains(
                "Neighborhood Welcome Project",
                "Homepage Festival",
                "Homepage Festival 2032",
                "\"id\":\"community\"");
    }

    private String request(long eventId, long announcementId, boolean eventsVisible) {
        return """
                {
                  "heroTitle": "Managed homepage",
                  "heroSubtitle": "A configured subtitle",
                  "heroImageUrl": "/images/homepage.jpg",
                  "ctaText": "Join the club",
                  "ctaUrl": "/membership",
                  "sections": [
                    {"type":"ANNOUNCEMENTS","visible":true,"displayOrder":0,"selectedIds":["%d"]},
                    {"type":"EVENTS","visible":%s,"displayOrder":1,"selectedIds":["%d"]},
                    {"type":"INITIATIVES","visible":true,"displayOrder":2,"selectedIds":[]},
                    {"type":"FESTIVALS","visible":true,"displayOrder":3,"selectedIds":[]},
                    {"type":"FESTIVAL_EDITIONS","visible":true,"displayOrder":4,"selectedIds":[]},
                    {"type":"GALLERY_ALBUMS","visible":true,"displayOrder":5,"selectedIds":[]}
                  ]
                }
                """.formatted(announcementId, eventsVisible, eventId);
    }

    private String requestAll(
            long eventId,
            long announcementId,
            long initiativeId,
            long festivalId,
            long editionId,
            String albumId) {
        return """
                {
                  "heroTitle": "Managed homepage",
                  "heroSubtitle": "A configured subtitle",
                  "heroImageUrl": "/images/homepage.jpg",
                  "ctaText": "Join the club",
                  "ctaUrl": "/membership",
                  "sections": [
                    {"type":"EVENTS","visible":true,"displayOrder":0,"selectedIds":["%d"]},
                    {"type":"ANNOUNCEMENTS","visible":true,"displayOrder":1,"selectedIds":["%d"]},
                    {"type":"INITIATIVES","visible":true,"displayOrder":2,"selectedIds":["%d"]},
                    {"type":"FESTIVALS","visible":true,"displayOrder":3,"selectedIds":["%d"]},
                    {"type":"FESTIVAL_EDITIONS","visible":true,"displayOrder":4,"selectedIds":["%d"]},
                    {"type":"GALLERY_ALBUMS","visible":true,"displayOrder":5,"selectedIds":["%s"]}
                  ]
                }
                """.formatted(eventId, announcementId, initiativeId, festivalId, editionId, albumId);
    }

    private HttpResponse<String> send(String method, String path, String body, boolean authenticated)
            throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + path))
                .header("Accept", "application/json");
        if (authenticated) {
            request.header("Authorization", ADMIN_AUTHORIZATION);
        }
        if (body != null) {
            request.header("Content-Type", "application/json");
        }
        return httpClient.send(
                request.method(
                        method,
                        body == null
                                ? HttpRequest.BodyPublishers.noBody()
                                : HttpRequest.BodyPublishers.ofString(body))
                        .build(),
                HttpResponse.BodyHandlers.ofString());
    }
}
