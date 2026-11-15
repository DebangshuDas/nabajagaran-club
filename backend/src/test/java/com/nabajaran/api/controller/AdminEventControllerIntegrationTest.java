package com.nabajaran.api.controller;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.LinkedHashMap;
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
class AdminEventControllerIntegrationTest {

    private static final String ADMIN_AUTHORIZATION = "Basic " + Base64.getEncoder()
            .encodeToString("admin:test-admin-password".getBytes(StandardCharsets.UTF_8));

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @LocalServerPort
    private int port;

    @Test
    void shouldRequireAdminAuthenticationAndValidateRequests() throws Exception {
        HttpResponse<String> anonymousList = send("GET", "/api/v1/admin/events", null, false);
        assertThat(anonymousList.statusCode()).isEqualTo(401);

        HttpResponse<String> anonymousCreate = send(
                "POST",
                "/api/v1/admin/events",
                toJson(eventRequest("Anonymous event", false)),
                false);
        assertThat(anonymousCreate.statusCode()).isEqualTo(401);

        Map<String, Object> invalidTitle = eventRequest("Invalid event", false);
        invalidTitle.put("title", " ");
        HttpResponse<String> invalidResponse = send(
                "POST",
                "/api/v1/admin/events",
                toJson(invalidTitle),
                true);
        assertThat(invalidResponse.statusCode()).isEqualTo(400);
        assertThat(invalidResponse.body()).contains("Title is required.");

        Map<String, Object> invalidSchedule = eventRequest("Invalid schedule", false);
        invalidSchedule.put("endAt", "2030-03-10T09:00:00");
        HttpResponse<String> scheduleResponse = send(
                "POST",
                "/api/v1/admin/events",
                toJson(invalidSchedule),
                true);
        assertThat(scheduleResponse.statusCode()).isEqualTo(400);
        assertThat(scheduleResponse.body()).contains("End date and time must be after");
    }

    @Test
    void shouldAllowLocalFrontendOriginForAdminMutations() throws Exception {
        Map<String, Object> invalidTitle = eventRequest("Invalid event", false);
        invalidTitle.put("title", " ");

        HttpResponse<String> response = send(
                "POST",
                "/api/v1/admin/events",
                toJson(invalidTitle),
                true,
                "http://localhost:5173");

        assertThat(response.statusCode()).isEqualTo(400);
        assertThat(response.headers().firstValue("Access-Control-Allow-Origin"))
                .contains("http://localhost:5173");
    }

    @Test
    void shouldCreateReadUpdateAndGenerateUniqueSlugs() throws Exception {
        String title = "Slug collision " + UUID.randomUUID();
        String first = createEvent(title, false);
        String second = createEvent(title, false);

        String firstSlug = jsonString(first, "slug");
        assertThat(firstSlug).isEqualTo(slugify(title));
        assertThat(jsonString(second, "slug")).isEqualTo(firstSlug + "-2");

        long id = jsonLong(first, "id");
        HttpResponse<String> getResponse = send("GET", "/api/v1/admin/events/" + id, null, true);
        assertThat(getResponse.statusCode()).isEqualTo(200);
        assertThat(jsonLong(getResponse.body(), "id")).isEqualTo(id);

        String search = URLEncoder.encode(title, StandardCharsets.UTF_8);
        HttpResponse<String> firstPage = send(
                "GET",
                "/api/v1/admin/events?search=" + search + "&page=0&size=1",
                null,
                true);
        assertThat(jsonLong(firstPage.body(), "totalElements")).isEqualTo(2);
        assertThat(jsonLong(firstPage.body(), "totalPages")).isEqualTo(2);
        assertThat(firstPage.body()).contains("\"content\":[{");
        HttpResponse<String> secondPage = send(
                "GET",
                "/api/v1/admin/events?search=" + search + "&page=1&size=1",
                null,
                true);
        assertThat(jsonLong(secondPage.body(), "page")).isEqualTo(1);
        assertThat(secondPage.body()).doesNotContain("\"content\":[]");

        String createdAt = jsonString(first, "createdAt");
        Map<String, Object> updatedRequest = eventRequest("Renamed event " + UUID.randomUUID(), true);
        updatedRequest.put("status", "ONGOING");
        HttpResponse<String> updateResponse = send(
                "PUT",
                "/api/v1/admin/events/" + id,
                toJson(updatedRequest),
                true);
        assertThat(updateResponse.statusCode()).isEqualTo(200);

        assertThat(jsonLong(updateResponse.body(), "id")).isEqualTo(id);
        assertThat(jsonString(updateResponse.body(), "createdAt")).isEqualTo(createdAt);
        assertThat(jsonString(updateResponse.body(), "title")).isEqualTo(updatedRequest.get("title"));
        assertThat(jsonString(updateResponse.body(), "status")).isEqualTo("ONGOING");
        assertThat(jsonBoolean(updateResponse.body(), "published")).isTrue();
        assertThat(send("/api/v1/events/upcoming").body()).doesNotContain(jsonString(updateResponse.body(), "slug"));
    }

    @Test
    void shouldSearchFilterPaginatePublishUnpublishAndSoftDeleteEvents() throws Exception {
        String title = "Visibility event " + UUID.randomUUID();
        String created = createEvent(title, false);
        long id = jsonLong(created, "id");
        String slug = jsonString(created, "slug");

        String search = URLEncoder.encode(title, StandardCharsets.UTF_8);
        HttpResponse<String> filteredResponse = send(
                "GET",
                "/api/v1/admin/events?search=" + search + "&status=UPCOMING&published=false&page=0&size=1",
                null,
                true);
        assertThat(filteredResponse.statusCode()).isEqualTo(200);
        assertThat(filteredResponse.body()).contains("\"content\":[{");
        assertThat(jsonLong(filteredResponse.body(), "totalElements")).isEqualTo(1);
        assertThat(jsonLong(filteredResponse.body(), "page")).isZero();
        assertThat(filteredResponse.body()).contains("\"id\":" + id);

        HttpResponse<String> publicBeforePublish = send("/api/v1/events/upcoming");
        assertThat(publicBeforePublish.statusCode()).isEqualTo(200);
        assertThat(publicBeforePublish.body()).doesNotContain(slug);

        HttpResponse<String> publishResponse = send(
                "PATCH",
                "/api/v1/admin/events/" + id + "/publish",
                null,
                true);
        assertThat(publishResponse.statusCode()).isEqualTo(200);
        assertThat(jsonBoolean(publishResponse.body(), "published")).isTrue();
        assertThat(send("/api/v1/events/upcoming").body()).contains(slug);

        HttpResponse<String> unpublishResponse = send(
                "PATCH",
                "/api/v1/admin/events/" + id + "/unpublish",
                null,
                true);
        assertThat(unpublishResponse.statusCode()).isEqualTo(200);
        assertThat(jsonBoolean(unpublishResponse.body(), "published")).isFalse();
        assertThat(send("/api/v1/events/upcoming").body()).doesNotContain(slug);

        send("PATCH", "/api/v1/admin/events/" + id + "/publish", null, true);
        HttpResponse<String> deleteResponse = send("DELETE", "/api/v1/admin/events/" + id, null, true);
        assertThat(deleteResponse.statusCode()).isEqualTo(204);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT deleted FROM events WHERE id = ?",
                Boolean.class,
                id)).isTrue();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT deleted_at IS NOT NULL FROM events WHERE id = ?",
                Boolean.class,
                id)).isTrue();

        assertThat(send("GET", "/api/v1/admin/events/" + id, null, true).statusCode()).isEqualTo(404);
        assertThat(send("/api/v1/events/upcoming").body()).doesNotContain(slug);
        HttpResponse<String> activeList = send(
                "GET",
                "/api/v1/admin/events?search=" + search + "&status=UPCOMING&published=true",
                null,
                true);
        assertThat(jsonLong(activeList.body(), "totalElements")).isZero();
    }

    private String createEvent(String title, boolean published) throws Exception {
        HttpResponse<String> response = send(
                "POST",
                "/api/v1/admin/events",
                toJson(eventRequest(title, published)),
                true);
        assertThat(response.statusCode()).isEqualTo(201);
        return response.body();
    }

    private Map<String, Object> eventRequest(String title, boolean published) {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("title", title);
        request.put("shortDescription", "A short event description.");
        request.put("description", "A complete event description.");
        request.put("eventType", "community");
        request.put("status", "UPCOMING");
        request.put("startAt", "2030-03-10T10:00:00");
        request.put("endAt", "2030-03-10T12:00:00");
        request.put("venue", "Community Hall");
        request.put("address", "123 Example Street");
        request.put("capacity", 50);
        request.put("imageUrl", "/images/community-event.jpg");
        request.put("published", published);
        return request;
    }

    private String slugify(String value) {
        return value.toLowerCase(java.util.Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
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
        String escaped = value.toString()
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r");
        return "\"" + escaped + "\"";
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

    private boolean jsonBoolean(String json, String field) {
        Matcher matcher = Pattern.compile(
                "\"" + Pattern.quote(field) + "\"\\s*:\\s*(true|false)")
                .matcher(json);
        assertThat(matcher.find()).as("JSON field %s", field).isTrue();
        return Boolean.parseBoolean(matcher.group(1));
    }

    private HttpResponse<String> send(String path) throws Exception {
        return send("GET", path, null, false);
    }

    private HttpResponse<String> send(String method, String path, String body, boolean authenticated)
            throws Exception {
        return send(method, path, body, authenticated, null);
    }

    private HttpResponse<String> send(
            String method,
            String path,
            String body,
            boolean authenticated,
            String origin) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + path))
                .header("Accept", "application/json");
        if (authenticated) {
            request.header("Authorization", ADMIN_AUTHORIZATION);
        }
        if (origin != null) {
            request.header("Origin", origin);
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
