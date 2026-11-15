package com.nabajaran.api.controller;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;

@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT,
        properties = "app.cors.allowed-origins=https://nabajagaran-club.debangshudas2001.workers.dev")
@ActiveProfiles("test")
@Sql("classpath:data.sql")
class ClubInfoControllerIntegrationTest {

    private static final String FRONTEND_ORIGIN =
            "https://nabajagaran-club.debangshudas2001.workers.dev";
    private static final String ADMIN_AUTHORIZATION = "Basic " + Base64.getEncoder()
            .encodeToString("admin:test-admin-password".getBytes(StandardCharsets.UTF_8));
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @LocalServerPort
    private int port;

    @Test
    void shouldReturnClubDetails() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/club"))
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body())
                .contains("\"clubName\":\"nabajagaran-club\"")
                .contains("\"city\":\"Demo City\"")
                .contains("\"email\":\"hello@example.com\"");
    }

    @Test
    void shouldReturnPublicCollectionsAsJsonArraysAndAllowConfiguredFrontendOrigin() throws Exception {
        for (String endpoint : List.of("/api/v1/events/upcoming", "/api/v1/announcements/published")) {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("http://localhost:" + port + endpoint))
                    .header("Accept", "application/json")
                    .header("Origin", FRONTEND_ORIGIN)
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

            assertThat(response.statusCode()).isEqualTo(200);
            assertThat(response.headers().firstValue("Access-Control-Allow-Origin"))
                    .contains(FRONTEND_ORIGIN);
            assertThat(response.headers().firstValue("Content-Type").orElse(""))
                    .contains("application/json");
            assertThat(response.body()).startsWith("[");
        }
    }

    @Test
    void shouldReturnClubDetailsWithConfiguredFrontendCorsOrigin() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/club"))
                .header("Accept", "application/json")
                .header("Origin", FRONTEND_ORIGIN)
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.headers().firstValue("Access-Control-Allow-Origin"))
                .contains(FRONTEND_ORIGIN);
        assertThat(response.body()).contains("\"clubName\":\"nabajagaran-club\"");
    }

    @Test
    void shouldHandleCorsPreflightForConfiguredFrontendOrigin() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/events/upcoming"))
                .header("Origin", FRONTEND_ORIGIN)
                .header("Access-Control-Request-Method", "GET")
                .header("Access-Control-Request-Headers", "authorization,content-type")
                .method("OPTIONS", HttpRequest.BodyPublishers.noBody())
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        String allowedHeaders = response.headers()
                .firstValue("Access-Control-Allow-Headers")
                .orElse("")
                .toLowerCase(java.util.Locale.ROOT);

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.headers().firstValue("Access-Control-Allow-Origin"))
                .contains(FRONTEND_ORIGIN);
        assertThat(response.headers().firstValue("Access-Control-Allow-Methods").orElse(""))
                .contains("GET");
        assertThat(allowedHeaders).contains("authorization", "content-type");
        assertThat(response.headers().firstValue("Access-Control-Allow-Credentials")).isEmpty();
    }

    @Test
    void shouldRejectCorsPreflightFromUnconfiguredOrigin() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/events/upcoming"))
                .header("Origin", "https://unconfigured.example")
                .header("Access-Control-Request-Method", "GET")
                .method("OPTIONS", HttpRequest.BodyPublishers.noBody())
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode()).isEqualTo(403);
        assertThat(response.headers().firstValue("Access-Control-Allow-Origin")).isEmpty();
    }

    @Test
    void shouldSeedEveryTableOnStartup() {
        String query = """
                SELECT COUNT(*) FROM club_info
                UNION ALL SELECT COUNT(*) FROM club_information
                UNION ALL SELECT COUNT(*) FROM events
                UNION ALL SELECT COUNT(*) FROM announcements
                UNION ALL SELECT COUNT(*) FROM members
                UNION ALL SELECT COUNT(*) FROM volunteer_registrations
                UNION ALL SELECT COUNT(*) FROM business_categories
                UNION ALL SELECT COUNT(*) FROM businesses
                UNION ALL SELECT COUNT(*) FROM community_initiatives
                UNION ALL SELECT COUNT(*) FROM sponsors
                UNION ALL SELECT COUNT(*) FROM gallery_images
                UNION ALL SELECT COUNT(*) FROM contact_messages
                """;

        List<Long> rowCounts = jdbcTemplate.query(query, (resultSet, rowNumber) -> resultSet.getLong(1));

        assertThat(rowCounts).hasSize(12).allSatisfy(count -> assertThat(count).isPositive());
    }

    @Test
    void shouldReturnHealthStatus() throws Exception {
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/health"))
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body())
                .contains("\"status\":\"UP\"")
                .contains("\"service\":\"nabajaran-api\"");
    }

    @Test
    void shouldRequireAdminAuthenticationWithoutExposingMemberInformation() throws Exception {
        HttpRequest unauthenticatedRequest = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/admin/dashboard"))
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> unauthenticatedResponse = httpClient.send(
                unauthenticatedRequest,
                HttpResponse.BodyHandlers.ofString());

        assertThat(unauthenticatedResponse.statusCode()).isEqualTo(401);

        String credentials = java.util.Base64.getEncoder()
                .encodeToString("admin:test-admin-password".getBytes(java.nio.charset.StandardCharsets.UTF_8));
        HttpRequest authenticatedRequest = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + "/api/v1/admin/dashboard"))
                .header("Accept", "application/json")
                .header("Authorization", "Basic " + credentials)
                .GET()
                .build();

        HttpResponse<String> authenticatedResponse = httpClient.send(
                authenticatedRequest,
                HttpResponse.BodyHandlers.ofString());

        assertThat(authenticatedResponse.statusCode()).isEqualTo(200);
        assertThat(authenticatedResponse.body())
                .contains("\"upcomingEvents\":1")
                .contains("\"publishedAnnouncements\":1")
                .contains("\"approvedBusinesses\":1")
                .doesNotContain("Demo Member")
                .doesNotContain("demo.member@example.com");
    }

    @Test
    void shouldUpdateTheExistingClubProfileAndExposeChangesPublicly() throws Exception {
        Map<String, Object> original = jdbcTemplate.queryForMap(
                "SELECT * FROM club_information WHERE deleted = FALSE ORDER BY id LIMIT 1");
        long originalId = ((Number) original.get("id")).longValue();
        String beforeResponse = getClubResponse().body();
        String originalCreatedAt = jsonString(beforeResponse, "createdAt");
        String originalUpdatedAt = jsonString(beforeResponse, "updatedAt");
        Map<String, Object> request = validProfileRequest("Updated Club " + UUID.randomUUID());
        request.put("mission", "A new club mission.");

        try {
            HttpResponse<String> updateResponse = send(
                    "PUT",
                    "/api/v1/admin/club",
                    toJson(request),
                    true);
            assertThat(updateResponse.statusCode()).isEqualTo(200);
            assertThat(jsonLong(updateResponse.body(), "id")).isEqualTo(originalId);
            assertThat(jsonString(updateResponse.body(), "createdAt")).isEqualTo(originalCreatedAt);
            assertThat(jsonString(updateResponse.body(), "updatedAt")).isNotEqualTo(originalUpdatedAt);
            assertThat(jsonString(updateResponse.body(), "mission")).isEqualTo("A new club mission.");

            String publicProfile = getClubResponse().body();
            assertThat(jsonString(publicProfile, "clubName")).isEqualTo(request.get("clubName"));
            assertThat(jsonString(publicProfile, "mission")).isEqualTo("A new club mission.");
        } finally {
            restoreClubProfile(original);
        }
    }

    @Test
    void shouldValidateProfileFieldsAndRequireAdminForUpdates() throws Exception {
        Map<String, Object> request = validProfileRequest("Validation Club");
        assertThat(send("PUT", "/api/v1/admin/club", toJson(request), false)
                .statusCode()).isEqualTo(401);

        request.put("clubName", " ");
        assertThat(send("PUT", "/api/v1/admin/club", toJson(request), true)
                .statusCode()).isEqualTo(400);

        request = validProfileRequest("Validation Club");
        request.put("email", "not-an-email");
        HttpResponse<String> invalidEmail = send(
                "PUT", "/api/v1/admin/club", toJson(request), true);
        assertThat(invalidEmail.statusCode()).isEqualTo(400);
        assertThat(invalidEmail.body()).contains("Email must be a valid email address.");

        request = validProfileRequest("Validation Club");
        request.put("website", "javascript:alert(1)");
        HttpResponse<String> invalidUrl = send(
                "PUT", "/api/v1/admin/club", toJson(request), true);
        assertThat(invalidUrl.statusCode()).isEqualTo(400);
        assertThat(invalidUrl.body()).contains("Website must be a valid HTTP or HTTPS URL.");

        request = validProfileRequest("Validation Club");
        request.put("foundedYear", 2999);
        assertThat(send("PUT", "/api/v1/admin/club", toJson(request), true)
                .statusCode()).isEqualTo(400);
    }

    @Test
    void shouldRejectMissingOrMultipleActiveClubProfiles() throws Exception {
        jdbcTemplate.update("UPDATE club_information SET deleted = TRUE, deleted_at = CURRENT_TIMESTAMP");
        try {
            assertThat(getClubResponse().statusCode()).isEqualTo(404);
            assertThat(send(
                    "PUT",
                    "/api/v1/admin/club",
                    toJson(validProfileRequest("No Profile")),
                    true).statusCode()).isEqualTo(404);
        } finally {
            jdbcTemplate.update("UPDATE club_information SET deleted = FALSE, deleted_at = NULL");
        }

        String duplicateName = "Duplicate profile " + UUID.randomUUID();
        jdbcTemplate.update(
                "INSERT INTO club_information (name, created_at, updated_at, deleted) "
                        + "VALUES (?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE)",
                duplicateName);
        try {
            assertThat(getClubResponse().statusCode()).isEqualTo(409);
            assertThat(send(
                    "PUT",
                    "/api/v1/admin/club",
                    toJson(validProfileRequest("Multiple Profiles")),
                    true).statusCode()).isEqualTo(409);
        } finally {
            jdbcTemplate.update("DELETE FROM club_information WHERE name = ?", duplicateName);
        }
    }

    private HttpResponse<String> getClubResponse() throws Exception {
        return send("GET", "/api/v1/club", null, false);
    }

    private Map<String, Object> validProfileRequest(String clubName) {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("clubName", clubName);
        request.put("tagline", "A club tagline");
        request.put("description", "A club description.");
        request.put("mission", "A club mission.");
        request.put("foundedYear", 2008);
        request.put("address", "123 Example Street");
        request.put("city", "Example City");
        request.put("state", "Example State");
        request.put("country", "Example Country");
        request.put("postalCode", "00000");
        request.put("email", "club@example.com");
        request.put("phone", "+1 555 0100");
        request.put("website", "https://example.com");
        request.put("facebookUrl", "https://facebook.com/example");
        request.put("instagramUrl", "https://instagram.com/example");
        return request;
    }

    private void restoreClubProfile(Map<String, Object> original) {
        jdbcTemplate.update(
                """
                UPDATE club_information
                SET name = ?, tagline = ?, description = ?, mission = ?, founding_year = ?,
                    address = ?, city = ?, state = ?, country = ?, postal_code = ?, email = ?,
                    phone = ?, website = ?, facebook_url = ?, instagram_url = ?, updated_at = ?
                WHERE id = ?
                """,
                original.get("name"),
                original.get("tagline"),
                original.get("description"),
                original.get("mission"),
                original.get("founding_year"),
                original.get("address"),
                original.get("city"),
                original.get("state"),
                original.get("country"),
                original.get("postal_code"),
                original.get("email"),
                original.get("phone"),
                original.get("website"),
                original.get("facebook_url"),
                original.get("instagram_url"),
                original.get("updated_at"),
                original.get("id"));
    }

    private String toJson(Map<String, Object> values) {
        String fields = values.entrySet().stream()
                .map(entry -> "\"" + entry.getKey() + "\":" + jsonValue(entry.getValue()))
                .collect(java.util.stream.Collectors.joining(","));
        return "{" + fields + "}";
    }

    private String jsonValue(Object value) {
        if (value == null) return "null";
        if (value instanceof Number || value instanceof Boolean) return value.toString();
        String escaped = value.toString()
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
        return "\"" + escaped + "\"";
    }

    private String jsonString(String json, String field) {
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile(
                "\"" + java.util.regex.Pattern.quote(field) + "\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"")
                .matcher(json);
        assertThat(matcher.find()).as("JSON field %s", field).isTrue();
        return matcher.group(1);
    }

    private long jsonLong(String json, String field) {
        java.util.regex.Matcher matcher = java.util.regex.Pattern.compile(
                "\"" + java.util.regex.Pattern.quote(field) + "\"\\s*:\\s*(-?\\d+)")
                .matcher(json);
        assertThat(matcher.find()).as("JSON field %s", field).isTrue();
        return Long.parseLong(matcher.group(1));
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
