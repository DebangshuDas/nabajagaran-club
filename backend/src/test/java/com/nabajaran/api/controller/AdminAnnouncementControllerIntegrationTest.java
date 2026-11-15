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
import org.junit.jupiter.api.AfterEach;
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
class AdminAnnouncementControllerIntegrationTest {

    private static final String ADMIN_AUTHORIZATION = "Basic " + Base64.getEncoder()
            .encodeToString("admin:test-admin-password".getBytes(StandardCharsets.UTF_8));

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @LocalServerPort
    private int port;

    @AfterEach
    void cleanUpTestAnnouncements() {
        jdbcTemplate.update("DELETE FROM announcements WHERE title LIKE 'Lifecycle announcement %'");
        jdbcTemplate.update("DELETE FROM announcements WHERE title LIKE 'Listable announcement %'");
        jdbcTemplate.update("DELETE FROM announcements WHERE title LIKE 'Public visibility %'");
    }

    @Test
    void shouldRequireAdminAuthenticationAndValidateRequests() throws Exception {
        assertThat(send("GET", "/api/v1/admin/announcements", null, false).statusCode()).isEqualTo(401);
        assertThat(send(
                "POST",
                "/api/v1/admin/announcements",
                toJson(createRequest("Anonymous announcement", false)),
                false).statusCode()).isEqualTo(401);
        Map<String, Object> updateRequest = new LinkedHashMap<>();
        updateRequest.put("title", "Unauthorized update");
        updateRequest.put("content", "This change must not be accepted.");
        updateRequest.put("audience", null);
        String updateBody = toJson(updateRequest);
        assertThat(send("PUT", "/api/v1/admin/announcements/1", updateBody, false).statusCode())
                .isEqualTo(401);
        assertThat(send("PATCH", "/api/v1/admin/announcements/1/publish", null, false).statusCode())
                .isEqualTo(401);
        assertThat(send("PATCH", "/api/v1/admin/announcements/1/unpublish", null, false).statusCode())
                .isEqualTo(401);
        assertThat(send("DELETE", "/api/v1/admin/announcements/1", null, false).statusCode())
                .isEqualTo(401);

        Map<String, Object> invalidRequest = createRequest("Invalid announcement", false);
        invalidRequest.put("title", " ");
        HttpResponse<String> invalidResponse = send(
                "POST",
                "/api/v1/admin/announcements",
                toJson(invalidRequest),
                true);
        assertThat(invalidResponse.statusCode()).isEqualTo(400);
        assertThat(invalidResponse.body()).contains("Title is required.");
    }

    @Test
    void shouldCreateUpdatePublishUnpublishRepublishAndSoftDelete() throws Exception {
        String title = "Lifecycle announcement " + UUID.randomUUID();
        HttpResponse<String> createResponse = send(
                "POST",
                "/api/v1/admin/announcements",
                toJson(createRequest(title, false)),
                true);
        assertThat(createResponse.statusCode()).isEqualTo(201);
        assertThat(jsonBoolean(createResponse.body(), "published")).isFalse();
        assertThat(createResponse.body()).contains("\"publishedAt\":null");

        long id = jsonLong(createResponse.body(), "id");
        String createdAt = jsonString(createResponse.body(), "createdAt");
        HttpResponse<String> detailResponse = send(
                "GET",
                "/api/v1/admin/announcements/" + id,
                null,
                true);
        assertThat(detailResponse.statusCode()).isEqualTo(200);
        assertThat(jsonLong(detailResponse.body(), "id")).isEqualTo(id);

        Map<String, Object> update = new LinkedHashMap<>();
        update.put("title", title + " updated");
        update.put("content", "Revised **content** with a link.");
        update.put("audience", "members");
        HttpResponse<String> updateResponse = send(
                "PUT",
                "/api/v1/admin/announcements/" + id,
                toJson(update),
                true);
        assertThat(updateResponse.statusCode()).isEqualTo(200);
        assertThat(jsonString(updateResponse.body(), "createdAt")).isEqualTo(createdAt);
        assertThat(jsonString(updateResponse.body(), "title")).isEqualTo(title + " updated");
        assertThat(jsonBoolean(updateResponse.body(), "published")).isFalse();

        HttpResponse<String> publishResponse = send(
                "PATCH",
                "/api/v1/admin/announcements/" + id + "/publish",
                null,
                true);
        assertThat(publishResponse.statusCode()).isEqualTo(200);
        assertThat(jsonBoolean(publishResponse.body(), "published")).isTrue();
        String firstPublishedAt = jsonString(publishResponse.body(), "publishedAt");

        HttpResponse<String> unpublishResponse = send(
                "PATCH",
                "/api/v1/admin/announcements/" + id + "/unpublish",
                null,
                true);
        assertThat(unpublishResponse.statusCode()).isEqualTo(200);
        assertThat(jsonBoolean(unpublishResponse.body(), "published")).isFalse();
        assertThat(jsonString(unpublishResponse.body(), "publishedAt")).isEqualTo(firstPublishedAt);

        HttpResponse<String> republishResponse = send(
                "PATCH",
                "/api/v1/admin/announcements/" + id + "/publish",
                null,
                true);
        assertThat(jsonBoolean(republishResponse.body(), "published")).isTrue();
        assertThat(jsonString(republishResponse.body(), "publishedAt")).isEqualTo(firstPublishedAt);

        assertThat(send(
                "DELETE",
                "/api/v1/admin/announcements/" + id,
                null,
                true).statusCode()).isEqualTo(204);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT deleted FROM announcements WHERE id = ?",
                Boolean.class,
                id)).isTrue();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT deleted_at IS NOT NULL FROM announcements WHERE id = ?",
                Boolean.class,
                id)).isTrue();
        assertThat(send("GET", "/api/v1/admin/announcements/" + id, null, true).statusCode()).isEqualTo(404);
        assertThat(send("/api/v1/announcements/published").body()).doesNotContain(title + " updated");
    }

    @Test
    void shouldSearchFilterPaginateAndSortActiveAnnouncements() throws Exception {
        String title = "Listable announcement " + UUID.randomUUID();
        String older = createAnnouncement(title + " older", false, "members");
        String newer = createAnnouncement(title + " newer", false, "public");
        String encodedTitle = URLEncoder.encode(title, StandardCharsets.UTF_8);

        HttpResponse<String> firstPage = send(
                "GET",
                "/api/v1/admin/announcements?search=" + encodedTitle
                        + "&published=false&page=0&size=1&sort=createdAt,desc",
                null,
                true);
        assertThat(firstPage.statusCode()).isEqualTo(200);
        assertThat(jsonLong(firstPage.body(), "totalElements")).isEqualTo(2);
        assertThat(jsonLong(firstPage.body(), "totalPages")).isEqualTo(2);
        HttpResponse<String> secondPage = send(
                "GET",
                "/api/v1/admin/announcements?search=" + encodedTitle
                        + "&published=false&page=1&size=1&sort=createdAt,desc",
                null,
                true);
        assertThat(jsonLong(secondPage.body(), "page")).isEqualTo(1);
        assertThat(firstPage.body()).doesNotContain("\"id\":" + jsonLong(secondPage.body(), "id") + ",");
        assertThat(firstPage.body()).satisfiesAnyOf(
                body -> assertThat(body).contains("\"id\":" + older + ","),
                body -> assertThat(body).contains("\"id\":" + newer + ","));

        HttpResponse<String> audienceResponse = send(
                "GET",
                "/api/v1/admin/announcements?search=" + encodedTitle + "&audience=members",
                null,
                true);
        assertThat(jsonLong(audienceResponse.body(), "totalElements")).isEqualTo(1);
        assertThat(audienceResponse.body()).contains("\"id\":" + older + ",");
        assertThat(audienceResponse.body()).doesNotContain("\"id\":" + newer + ",");

        HttpResponse<String> invalidSort = send(
                "GET",
                "/api/v1/admin/announcements?sort=title,desc",
                null,
                true);
        assertThat(invalidSort.statusCode()).isEqualTo(400);
    }

    @Test
    void publicApiMustExcludeDraftsAndDeletedItemsAndSortByPublicationDate() throws Exception {
        String prefix = "Public visibility " + UUID.randomUUID();
        String oldest = createAnnouncement(prefix + " oldest", true, "public");
        String newest = createAnnouncement(prefix + " newest", true, "public");
        String draft = createAnnouncement(prefix + " draft", false, "public");
        String deleted = createAnnouncement(prefix + " deleted", true, "public");

        jdbcTemplate.update(
                "UPDATE announcements SET published_at = TIMESTAMP '2020-01-01 00:00:00' WHERE id = ?",
                Long.parseLong(oldest));
        jdbcTemplate.update(
                "UPDATE announcements SET published_at = TIMESTAMP '2021-01-01 00:00:00' WHERE id = ?",
                Long.parseLong(newest));
        send("DELETE", "/api/v1/admin/announcements/" + deleted, null, true);

        HttpResponse<String> response = send("/api/v1/announcements/published");
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).contains("\"id\":" + newest + ",", "\"id\":" + oldest + ",");
        assertThat(response.body()).doesNotContain(
                "\"id\":" + draft + ",",
                "\"id\":" + deleted + ",");
        assertThat(response.body().indexOf("\"id\":" + newest))
                .isLessThan(response.body().indexOf("\"id\":" + oldest));
    }

    private String createAnnouncement(String title, boolean publishImmediately, String audience) throws Exception {
        Map<String, Object> request = createRequest(title, publishImmediately);
        request.put("audience", audience);
        HttpResponse<String> response = send(
                "POST",
                "/api/v1/admin/announcements",
                toJson(request),
                true);
        assertThat(response.statusCode()).isEqualTo(201);
        return Long.toString(jsonLong(response.body(), "id"));
    }

    private Map<String, Object> createRequest(String title, boolean publishImmediately) {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("title", title);
        request.put("content", "A paragraph with **formatting** and a [link](https://example.com).\n\n- First item");
        request.put("audience", null);
        request.put("publishImmediately", publishImmediately);
        return request;
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
        HttpRequest.Builder request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + path))
                .header("Accept", "application/json");
        if (authenticated) request.header("Authorization", ADMIN_AUTHORIZATION);
        if (body != null) request.header("Content-Type", "application/json");
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
