package com.nabajaran.api.controller;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
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
class AdminCommunityInitiativeControllerIntegrationTest {

    private static final String ADMIN_AUTHORIZATION = "Basic " + Base64.getEncoder()
            .encodeToString("admin:test-admin-password".getBytes(StandardCharsets.UTF_8));

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @LocalServerPort
    private int port;

    @Test
    void shouldProtectAdminEndpointsAndValidateInitiativeRequests() throws Exception {
        assertThat(send("GET", "/api/v1/admin/initiatives", null, false).statusCode()).isEqualTo(401);
        assertThat(send(
                "POST",
                "/api/v1/admin/initiatives",
                toJson(initiativeRequest("Anonymous initiative", "anonymous-initiative", false, List.of())),
                false).statusCode()).isEqualTo(401);
        assertThat(send("GET", "/api/v1/initiatives/published", null, false).statusCode()).isEqualTo(200);

        Map<String, Object> invalidTitle = initiativeRequest(
                "Invalid initiative", "invalid-initiative", false, List.of());
        invalidTitle.put("title", " ");
        HttpResponse<String> titleResponse = send(
                "POST", "/api/v1/admin/initiatives", toJson(invalidTitle), true);
        assertThat(titleResponse.statusCode()).isEqualTo(400);
        assertThat(titleResponse.body()).contains("Title is required.");

        Map<String, Object> invalidDates = initiativeRequest(
                "Invalid dates", "invalid-dates", false, List.of());
        invalidDates.put("startDate", "2030-03-10");
        invalidDates.put("endDate", "2030-03-09");
        HttpResponse<String> dateResponse = send(
                "POST", "/api/v1/admin/initiatives", toJson(invalidDates), true);
        assertThat(dateResponse.statusCode()).isEqualTo(400);
        assertThat(dateResponse.body()).contains("End date cannot be before the start date.");

        Map<String, Object> invalidUrl = initiativeRequest(
                "Invalid URL", "invalid-url", false, List.of());
        invalidUrl.put("imageUrl", "https:///not-a-host");
        HttpResponse<String> urlResponse = send(
                "POST", "/api/v1/admin/initiatives", toJson(invalidUrl), true);
        assertThat(urlResponse.statusCode()).isEqualTo(400);
        assertThat(urlResponse.body()).contains("Cover image URL must be a valid HTTP or HTTPS URL.");

        Map<String, Object> invalidStatus = initiativeRequest(
                "Invalid status", "invalid-status", false, List.of());
        invalidStatus.put("status", "ONGOING");
        HttpResponse<String> statusResponse = send(
                "POST", "/api/v1/admin/initiatives", toJson(invalidStatus), true);
        assertThat(statusResponse.statusCode()).isEqualTo(400);
        assertThat(statusResponse.body()).contains("Status must be PLANNED, ACTIVE, or COMPLETED.");
    }

    @Test
    void shouldCreateUpdatePublishAssociateEventsAndSoftDelete() throws Exception {
        String suffix = UUID.randomUUID().toString();
        String title = "Community initiative " + suffix;
        String slug = "community-initiative-" + suffix;
        long publishedEventId = eventId("demo-community-welcome-gathering");
        String privateEventTitle = "Private related event " + suffix;
        long privateEventId = jsonLong(createEvent(privateEventTitle), "id");
        Map<String, Object> request = initiativeRequest(
                title, slug, true, List.of(publishedEventId, privateEventId));

        HttpResponse<String> createResponse = send(
                "POST", "/api/v1/admin/initiatives", toJson(request), true);
        assertThat(createResponse.statusCode()).isEqualTo(201);
        long id = jsonLong(createResponse.body(), "id");
        String createdAt = jsonString(createResponse.body(), "createdAt");
        String originalUpdatedAt = jsonString(createResponse.body(), "updatedAt");
        assertThat(jsonString(createResponse.body(), "slug")).isEqualTo(slug);
        assertThat(createResponse.body()).contains("\"relatedEvents\":[");
        assertThat(countOccurrences(createResponse.body(), "\"startAt\"")).isEqualTo(2);

        HttpResponse<String> publicResponse = send("GET", "/api/v1/initiatives/published", null, false);
        assertThat(publicResponse.statusCode()).isEqualTo(200);
        assertThat(publicResponse.body()).contains(slug, "demo-community-welcome-gathering");
        assertThat(publicResponse.body()).doesNotContain(privateEventTitle);

        Map<String, Object> duplicateSlugRequest = initiativeRequest(
                "Duplicate title " + suffix, slug, false, List.of());
        HttpResponse<String> duplicateResponse = send(
                "POST", "/api/v1/admin/initiatives", toJson(duplicateSlugRequest), true);
        assertThat(duplicateResponse.statusCode()).isEqualTo(409);
        assertThat(duplicateResponse.body()).contains("An initiative with this slug already exists.");

        HttpResponse<String> getResponse = send("GET", "/api/v1/admin/initiatives/" + id, null, true);
        assertThat(getResponse.statusCode()).isEqualTo(200);
        assertThat(jsonLong(getResponse.body(), "id")).isEqualTo(id);

        jdbcTemplate.update(
                "UPDATE community_initiatives SET updated_at = CURRENT_TIMESTAMP - INTERVAL '1' DAY WHERE id = ?",
                id);
        request.put("title", "Updated initiative " + suffix);
        request.put("slug", "updated-initiative-" + suffix);
        request.put("status", "COMPLETED");
        request.put("relatedEventIds", List.of(publishedEventId));
        HttpResponse<String> updateResponse = send(
                "PUT", "/api/v1/admin/initiatives/" + id, toJson(request), true);
        assertThat(updateResponse.statusCode()).isEqualTo(200);
        assertThat(jsonLong(updateResponse.body(), "id")).isEqualTo(id);
        assertThat(jsonString(updateResponse.body(), "createdAt")).isEqualTo(createdAt);
        assertThat(jsonString(updateResponse.body(), "status")).isEqualTo("COMPLETED");
        assertThat(countOccurrences(updateResponse.body(), "\"startAt\"")).isEqualTo(1);
        assertThat(jsonString(updateResponse.body(), "updatedAt")).isNotEqualTo(originalUpdatedAt);

        String search = URLEncoder.encode("Updated initiative " + suffix, StandardCharsets.UTF_8);
        HttpResponse<String> filteredResponse = send(
                "GET",
                "/api/v1/admin/initiatives?search=" + search
                        + "&category=Test%20category&status=COMPLETED&published=true&page=0&size=1",
                null,
                true);
        assertThat(filteredResponse.statusCode()).isEqualTo(200);
        assertThat(jsonLong(filteredResponse.body(), "totalElements")).isEqualTo(1);
        assertThat(jsonLong(filteredResponse.body(), "totalPages")).isEqualTo(1);

        assertThat(send("PATCH", "/api/v1/admin/initiatives/" + id + "/unpublish", null, true)
                .statusCode()).isEqualTo(200);
        assertThat(send("GET", "/api/v1/initiatives/published", null, false).body())
                .doesNotContain("updated-initiative-" + suffix);
        assertThat(send("PATCH", "/api/v1/admin/initiatives/" + id + "/publish", null, true)
                .statusCode()).isEqualTo(200);

        assertThat(send("DELETE", "/api/v1/admin/initiatives/" + id, null, true).statusCode()).isEqualTo(204);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT deleted FROM community_initiatives WHERE id = ?",
                Boolean.class,
                id)).isTrue();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT deleted FROM events WHERE id = ?",
                Boolean.class,
                privateEventId)).isFalse();
        assertThat(send("GET", "/api/v1/admin/initiatives/" + id, null, true).statusCode()).isEqualTo(404);
        assertThat(send("GET", "/api/v1/initiatives/published", null, false).body())
                .doesNotContain("updated-initiative-" + suffix);
    }

    private String createEvent(String title) throws Exception {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("title", title);
        request.put("shortDescription", "Related event.");
        request.put("description", "An event associated with an initiative.");
        request.put("eventType", "community");
        request.put("status", "UPCOMING");
        request.put("startAt", "2030-03-10T10:00:00");
        request.put("endAt", null);
        request.put("venue", "Community Hall");
        request.put("address", null);
        request.put("capacity", null);
        request.put("imageUrl", null);
        request.put("published", false);
        HttpResponse<String> response = send("POST", "/api/v1/admin/events", toJson(request), true);
        assertThat(response.statusCode()).isEqualTo(201);
        return response.body();
    }

    private long eventId(String slug) {
        return jdbcTemplate.queryForObject("SELECT id FROM events WHERE slug = ?", Long.class, slug);
    }

    private Map<String, Object> initiativeRequest(
            String title,
            String slug,
            boolean published,
            List<Long> relatedEventIds) {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("title", title);
        request.put("slug", slug);
        request.put("category", "Test category");
        request.put("shortDescription", "A short initiative summary.");
        request.put("description", "A full initiative description.");
        request.put("imageUrl", "https://example.com/initiative.jpg");
        request.put("startDate", "2030-03-10");
        request.put("endDate", "2030-03-11");
        request.put("location", "Community Hall");
        request.put("status", "ACTIVE");
        request.put("published", published);
        request.put("relatedEventIds", relatedEventIds);
        return request;
    }

    private String toJson(Map<String, Object> values) {
        String fields = values.entrySet().stream()
                .map(entry -> "\"" + entry.getKey() + "\":" + jsonValue(entry.getValue()))
                .collect(java.util.stream.Collectors.joining(","));
        return "{" + fields + "}";
    }

    private String jsonValue(Object value) {
        if (value == null) {
            return "null";
        }
        if (value instanceof Number || value instanceof Boolean) {
            return value.toString();
        }
        if (value instanceof Iterable<?> iterable) {
            List<String> values = new ArrayList<>();
            iterable.forEach(item -> values.add(jsonValue(item)));
            return "[" + String.join(",", values) + "]";
        }
        String escaped = value.toString()
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
        return "\"" + escaped + "\"";
    }

    private int countOccurrences(String value, String match) {
        int count = 0;
        int index = 0;
        while ((index = value.indexOf(match, index)) >= 0) {
            count++;
            index += match.length();
        }
        return count;
    }

    private String jsonString(String json, String field) {
        Matcher matcher = Pattern.compile(
                "\"" + Pattern.quote(field) + "\"\\s*:\\s*\"((?:\\\\.|[^\"\\\\])*)\"")
                .matcher(json);
        assertThat(matcher.find()).as("JSON field %s", field).isTrue();
        return matcher.group(1);
    }

    private long jsonLong(String json, String field) {
        Matcher matcher = Pattern.compile(
                "\"" + Pattern.quote(field) + "\"\\s*:\\s*(-?\\d+)")
                .matcher(json);
        assertThat(matcher.find()).as("JSON field %s", field).isTrue();
        return Long.parseLong(matcher.group(1));
    }

    private HttpResponse<String> send(String path) throws Exception {
        return send("GET", path, null, false);
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
