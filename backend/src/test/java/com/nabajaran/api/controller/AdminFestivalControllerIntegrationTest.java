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
class AdminFestivalControllerIntegrationTest {

    private static final String ADMIN_AUTHORIZATION = "Basic " + Base64.getEncoder()
            .encodeToString("admin:test-admin-password".getBytes(StandardCharsets.UTF_8));

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @LocalServerPort
    private int port;

    @Test
    void shouldProtectAdminEndpointsAndValidateFestivalAndEditionRequests() throws Exception {
        assertThat(send("GET", "/api/v1/admin/festivals", null, false).statusCode()).isEqualTo(401);
        assertThat(send(
                "GET",
                "/api/v1/admin/festival-associations?type=EVENT",
                null,
                false).statusCode()).isEqualTo(401);
        assertThat(send(
                "POST",
                "/api/v1/admin/festivals",
                toJson(festivalRequest("Anonymous festival", "anonymous-festival", false)),
                false).statusCode()).isEqualTo(401);
        assertThat(send("GET", "/api/v1/festivals/published", null, false).statusCode()).isEqualTo(200);

        Map<String, Object> invalidFestival = festivalRequest("Festival", "Not-a-valid-slug", false);
        HttpResponse<String> slugResponse = send(
                "POST", "/api/v1/admin/festivals", toJson(invalidFestival), true);
        assertThat(slugResponse.statusCode()).isEqualTo(400);
        assertThat(slugResponse.body()).contains("Slug must use lowercase letters, numbers, and hyphens.");

        invalidFestival = festivalRequest("Festival", "invalid-cover-url", false);
        invalidFestival.put("coverImageUrl", "https:///missing-host");
        HttpResponse<String> imageResponse = send(
                "POST", "/api/v1/admin/festivals", toJson(invalidFestival), true);
        assertThat(imageResponse.statusCode()).isEqualTo(400);
        assertThat(imageResponse.body()).contains("Cover image URL must be a valid HTTP or HTTPS URL.");

        String suffix = UUID.randomUUID().toString();
        long festivalId = jsonLong(createFestival(
                "Validation festival " + suffix,
                "validation-festival-" + suffix,
                false).body(), "id");
        Map<String, Object> invalidEdition = editionRequest(2030, false, List.of(), List.of(), List.of());
        invalidEdition.put("startDate", "2030-10-12");
        invalidEdition.put("endDate", "2030-10-11");
        HttpResponse<String> dateResponse = send(
                "POST",
                "/api/v1/admin/festivals/" + festivalId + "/editions",
                toJson(invalidEdition),
                true);
        assertThat(dateResponse.statusCode()).isEqualTo(400);
        assertThat(dateResponse.body()).contains("End date cannot be before the start date.");

        invalidEdition = editionRequest(0, false, List.of(), List.of(), List.of());
        HttpResponse<String> yearResponse = send(
                "POST",
                "/api/v1/admin/festivals/" + festivalId + "/editions",
                toJson(invalidEdition),
                true);
        assertThat(yearResponse.statusCode()).isEqualTo(400);
        assertThat(yearResponse.body()).contains("Edition year must be between 1 and 9999.");
    }

    @Test
    void shouldCreateEditPublishAssociateAndPreserveFestivalEditions() throws Exception {
        String suffix = UUID.randomUUID().toString();
        String festivalSlug = "shared-festival-" + suffix;
        HttpResponse<String> createdFestival = createFestival("Shared festival " + suffix, festivalSlug, false);
        long festivalId = jsonLong(createdFestival.body(), "id");
        String createdAt = jsonString(createdFestival.body(), "createdAt");
        String originalUpdatedAt = jsonString(createdFestival.body(), "updatedAt");

        HttpResponse<String> duplicateFestival = createFestival(
                "Another festival " + suffix, festivalSlug, false);
        assertThat(duplicateFestival.statusCode()).isEqualTo(409);

        Map<String, Object> update = festivalRequest(
                "Updated shared festival " + suffix, "updated-shared-festival-" + suffix, false);
        HttpResponse<String> updateResponse = send(
                "PUT", "/api/v1/admin/festivals/" + festivalId, toJson(update), true);
        assertThat(updateResponse.statusCode()).isEqualTo(200);
        assertThat(jsonLong(updateResponse.body(), "id")).isEqualTo(festivalId);
        assertThat(jsonString(updateResponse.body(), "createdAt")).isEqualTo(createdAt);
        assertThat(jsonString(updateResponse.body(), "updatedAt")).isNotEqualTo(originalUpdatedAt);

        long eventId = jdbcTemplate.queryForObject(
                "SELECT id FROM events WHERE slug = ?",
                Long.class,
                "demo-community-welcome-gathering");
        long galleryImageId = jdbcTemplate.queryForObject(
                "SELECT id FROM gallery_images WHERE image_url = ?",
                Long.class,
                "/images/demo-community-gathering.jpg");
        long sponsorId = jdbcTemplate.queryForObject(
                "SELECT id FROM sponsors WHERE slug = ?",
                Long.class,
                "demo-community-supporter");

        HttpResponse<String> firstEdition = createEdition(
                festivalId,
                editionRequest(2030, false, List.of(eventId), List.of(galleryImageId), List.of(sponsorId)));
        assertThat(firstEdition.statusCode()).isEqualTo(201);
        long deletedEditionId = jsonLong(firstEdition.body(), "id");
        assertThat(firstEdition.body()).contains("\"events\":[{", "\"galleryImages\":[{", "\"sponsors\":[{");

        HttpResponse<String> secondEdition = createEdition(
                festivalId,
                editionRequest(2031, false, List.of(), List.of(), List.of()));
        assertThat(secondEdition.statusCode()).isEqualTo(201);

        HttpResponse<String> duplicateYear = createEdition(
                festivalId,
                editionRequest(2030, false, List.of(), List.of(), List.of()));
        assertThat(duplicateYear.statusCode()).isEqualTo(409);
        assertThat(duplicateYear.body()).contains("An active edition already exists for this festival year.");

        HttpResponse<String> deleteEdition = send(
                "DELETE",
                "/api/v1/admin/festivals/" + festivalId + "/editions/" + deletedEditionId,
                null,
                true);
        assertThat(deleteEdition.statusCode()).isEqualTo(204);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT deleted FROM festival_editions WHERE id = ?",
                Boolean.class,
                deletedEditionId)).isTrue();

        HttpResponse<String> reusedYear = createEdition(
                festivalId,
                editionRequest(2030, false, List.of(eventId), List.of(galleryImageId), List.of(sponsorId)));
        assertThat(reusedYear.statusCode()).isEqualTo(201);
        long activeEditionId = jsonLong(reusedYear.body(), "id");

        HttpResponse<String> activeEditions = send(
                "GET",
                "/api/v1/admin/festivals/" + festivalId + "/editions?page=0&size=10",
                null,
                true);
        assertThat(jsonLong(activeEditions.body(), "totalElements")).isEqualTo(2);

        String eventSearch = URLEncoder.encode("Community Welcome", StandardCharsets.UTF_8);
        HttpResponse<String> eventOptions = send(
                "GET",
                "/api/v1/admin/festival-associations?type=EVENT&search=" + eventSearch,
                null,
                true);
        assertThat(eventOptions.statusCode()).isEqualTo(200);
        assertThat(eventOptions.body()).contains("Community Welcome Gathering");

        HttpResponse<String> publicBeforePublish = send("/api/v1/festivals/published");
        assertThat(publicBeforePublish.body()).doesNotContain(festivalSlug);
        assertThat(send(
                "GET",
                "/api/v1/festivals/" + jsonString(updateResponse.body(), "slug"),
                null,
                false).statusCode()).isEqualTo(404);

        assertThat(send("PATCH", "/api/v1/admin/festivals/" + festivalId + "/publish", null, true)
                .statusCode()).isEqualTo(200);
        HttpResponse<String> publicWithoutPublishedEditions = send(
                "GET",
                "/api/v1/festivals/" + jsonString(updateResponse.body(), "slug"),
                null,
                false);
        assertThat(publicWithoutPublishedEditions.statusCode()).isEqualTo(200);
        assertThat(publicWithoutPublishedEditions.body()).doesNotContain("\"year\":2030");

        assertThat(send(
                "PATCH",
                "/api/v1/admin/festivals/" + festivalId + "/editions/" + activeEditionId + "/publish",
                null,
                true).statusCode()).isEqualTo(200);
        HttpResponse<String> publicFestival = send(
                "GET",
                "/api/v1/festivals/" + jsonString(updateResponse.body(), "slug"),
                null,
                false);
        assertThat(publicFestival.statusCode()).isEqualTo(200);
        assertThat(publicFestival.body()).contains("\"year\":2030");
        assertThat(publicFestival.body()).contains("Community Welcome Gathering");
        assertThat(publicFestival.body()).contains("Community Supporter");
        assertThat(publicFestival.body()).contains("/images/demo-community-gathering.jpg");

        assertThat(send(
                "PATCH",
                "/api/v1/admin/festivals/" + festivalId + "/editions/" + activeEditionId + "/unpublish",
                null,
                true).statusCode()).isEqualTo(200);
        HttpResponse<String> publicWithoutEdition = send(
                "GET",
                "/api/v1/festivals/" + jsonString(updateResponse.body(), "slug"),
                null,
                false);
        assertThat(publicWithoutEdition.body()).doesNotContain("\"year\":2030");

        assertThat(send(
                "PATCH",
                "/api/v1/admin/festivals/" + festivalId + "/editions/" + activeEditionId + "/publish",
                null,
                true).statusCode()).isEqualTo(200);
        assertThat(send(
                "PATCH",
                "/api/v1/admin/festivals/" + festivalId + "/unpublish",
                null,
                true).statusCode()).isEqualTo(200);
        assertThat(send("/api/v1/festivals/published").body())
                .doesNotContain(jsonString(updateResponse.body(), "slug"));

        HttpResponse<String> deleteFestival = send(
                "DELETE", "/api/v1/admin/festivals/" + festivalId, null, true);
        assertThat(deleteFestival.statusCode()).isEqualTo(409);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT deleted FROM events WHERE id = ?",
                Boolean.class,
                eventId)).isFalse();
    }

    @Test
    void shouldSoftDeleteFestivalProfilesWithoutEditionHistory() throws Exception {
        String suffix = UUID.randomUUID().toString();
        String slug = "empty-festival-" + suffix;
        HttpResponse<String> created = createFestival("Empty festival " + suffix, slug, true);
        long id = jsonLong(created.body(), "id");

        HttpResponse<String> deleteResponse = send("DELETE", "/api/v1/admin/festivals/" + id, null, true);
        assertThat(deleteResponse.statusCode()).isEqualTo(204);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT deleted FROM festivals WHERE id = ?",
                Boolean.class,
                id)).isTrue();
        assertThat(send("/api/v1/festivals/published").body()).doesNotContain(slug);
    }

    private HttpResponse<String> createFestival(String name, String slug, boolean published) throws Exception {
        return send(
                "POST",
                "/api/v1/admin/festivals",
                toJson(festivalRequest(name, slug, published)),
                true);
    }

    private HttpResponse<String> createEdition(long festivalId, Map<String, Object> request) throws Exception {
        return send(
                "POST",
                "/api/v1/admin/festivals/" + festivalId + "/editions",
                toJson(request),
                true);
    }

    private Map<String, Object> festivalRequest(String name, String slug, boolean published) {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("name", name);
        request.put("slug", slug);
        request.put("description", "A festival profile description.");
        request.put("history", "History supplied by the administrator.");
        request.put("coverImageUrl", "https://example.com/festival-cover.jpg");
        request.put("published", published);
        return request;
    }

    private Map<String, Object> editionRequest(
            int year,
            boolean published,
            List<Long> eventIds,
            List<Long> galleryImageIds,
            List<Long> sponsorIds) {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("year", year);
        request.put("theme", "Administrator-provided theme");
        request.put("description", "Edition description.");
        request.put("startDate", "2030-10-10");
        request.put("endDate", "2030-10-12");
        request.put("venue", "Community Hall");
        request.put("address", "12 Example Road");
        request.put("published", published);
        request.put("eventIds", eventIds);
        request.put("galleryImageIds", galleryImageIds);
        request.put("sponsorIds", sponsorIds);
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
