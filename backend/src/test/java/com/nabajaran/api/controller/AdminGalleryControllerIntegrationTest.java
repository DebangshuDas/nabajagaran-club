package com.nabajaran.api.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;
import com.nabajaran.api.service.GalleryObjectStorage;
import com.nabajaran.api.exception.BadRequestException;
import com.nabajaran.api.service.GalleryImageValidator;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import javax.imageio.ImageIO;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.jdbc.Sql;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
@Sql("classpath:data.sql")
@Import(AdminGalleryControllerIntegrationTest.StorageTestConfiguration.class)
class AdminGalleryControllerIntegrationTest {

    private static final String ADMIN_AUTHORIZATION = "Basic " + Base64.getEncoder()
            .encodeToString("admin:test-admin-password".getBytes(StandardCharsets.UTF_8));
    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private GalleryImageValidator imageValidator;

    @LocalServerPort
    private int port;

    @Test
    void shouldRequireAdminAndRejectInvalidAlbumsAndUploads() throws Exception {
        assertThat(send("GET", "/api/v1/admin/gallery/albums", null, false).statusCode()).isEqualTo(401);
        assertThat(send("POST", "/api/v1/admin/gallery/albums", "{}", false).statusCode()).isEqualTo(401);
        assertThat(upload(1, false, pngImage()).statusCode()).isEqualTo(401);

        Map<String, Object> invalidAssociation = albumRequest("Invalid album", "gallery-test", false);
        invalidAssociation.put("eventId", 1);
        invalidAssociation.put("initiativeId", 1);
        HttpResponse<String> multipleAssociations = send(
                "POST",
                "/api/v1/admin/gallery/albums",
                toJson(invalidAssociation),
                true);
        assertThat(multipleAssociations.statusCode()).isEqualTo(400);
        assertThat(multipleAssociations.body()).contains("at most one event");

        long albumId = createAlbum("Upload validation " + UUID.randomUUID(), "validation", null);
        HttpResponse<String> invalidImage = upload(albumId, true, "not an image".getBytes(StandardCharsets.UTF_8));
        assertThat(invalidImage.statusCode()).isEqualTo(400);
        assertThat(invalidImage.body()).contains("Only JPEG and PNG images are permitted.");
        assertThatThrownBy(() -> imageValidator.validate(new MockMultipartFile(
                "files",
                "large.png",
                "image/png",
                new byte[(int) GalleryImageValidator.MAX_FILE_SIZE_BYTES + 1])))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("10 MiB");

        byte[][] tooManyImages = new byte[11][];
        for (int index = 0; index < tooManyImages.length; index++) {
            tooManyImages[index] = pngImage();
        }
        HttpResponse<String> tooMany = upload(albumId, true, tooManyImages);
        assertThat(tooMany.statusCode()).isEqualTo(400);
        assertThat(tooMany.body()).contains("No more than 10 images");
    }

    @Test
    void shouldManageAlbumImagesAndExposeOnlyPublishedContent() throws Exception {
        String suffix = UUID.randomUUID().toString();
        String category = "gallery-event-" + suffix;
        long eventId = createEvent("Gallery event " + suffix);
        long albumId = createAlbum("Event photos " + suffix, category, eventId);

        HttpResponse<String> uploaded = upload(albumId, true, pngImage(), pngImage());
        assertThat(uploaded.statusCode()).isEqualTo(201);
        JsonNode uploadedImages = objectMapper.readTree(uploaded.body());
        long firstImageId = uploadedImages.get(0).get("id").asLong();
        long secondImageId = uploadedImages.get(1).get("id").asLong();
        String secondImageUrl = uploadedImages.get(1).get("imageUrl").asText();
        assertThat(uploaded.body()).contains("\"published\":false", "\"albumId\":" + albumId);
        assertThat(send("/api/v1/gallery/albums?category=" + category).body()).isEqualTo("[]");

        Map<String, Object> imageMetadata = new LinkedHashMap<>();
        imageMetadata.put("albumId", albumId);
        imageMetadata.put("title", "Neighbourhood gathering");
        imageMetadata.put("caption", "A caption supplied by the administrator.");
        imageMetadata.put("altText", "People gathered at the community hall");
        imageMetadata.put("displayOrder", 0);
        imageMetadata.put("published", true);
        assertThat(send(
                "PUT",
                "/api/v1/admin/gallery/images/" + firstImageId,
                toJson(imageMetadata),
                true).statusCode()).isEqualTo(200);
        assertThat(send(
                "PATCH",
                "/api/v1/admin/gallery/images/" + secondImageId + "/publish",
                null,
                true).statusCode()).isEqualTo(200);

        HttpResponse<String> reorder = send(
                "PUT",
                "/api/v1/admin/gallery/albums/" + albumId + "/images/order",
                toJson(Map.of("imageIds", List.of(secondImageId, firstImageId))),
                true);
        assertThat(reorder.statusCode()).isEqualTo(200);
        assertThat(objectMapper.readTree(reorder.body()).get(0).get("id").asLong()).isEqualTo(secondImageId);

        Map<String, Object> albumUpdate = albumRequest("Event photos " + suffix, category, true);
        albumUpdate.put("eventId", eventId);
        albumUpdate.put("coverImageId", secondImageId);
        HttpResponse<String> publishedAlbum = send(
                "PUT",
                "/api/v1/admin/gallery/albums/" + albumId,
                toJson(albumUpdate),
                true);
        assertThat(publishedAlbum.statusCode()).isEqualTo(200);
        assertThat(publishedAlbum.body()).contains(secondImageUrl);

        HttpResponse<String> publicAlbums = send("/api/v1/gallery/albums?category=" + category);
        assertThat(publicAlbums.statusCode()).isEqualTo(200);
        assertThat(publicAlbums.body())
                .contains("Neighbourhood gathering", "A caption supplied by the administrator.", secondImageUrl)
                .doesNotContain("\"storageKey\"", "\"published\":false");
        JsonNode publicAlbum = objectMapper.readTree(publicAlbums.body()).get(0);
        assertThat(publicAlbum.get("images").size()).isEqualTo(2);
        assertThat(publicAlbum.get("images").get(0).get("id").asLong()).isEqualTo(secondImageId);
        assertThat(publicAlbum.get("images").get(0).get("altText").asText()).isEmpty();
        assertThat(publicAlbum.get("images").get(1).get("altText").asText())
                .isEqualTo("People gathered at the community hall");

        HttpResponse<String> publicEvents = send("/api/v1/events/upcoming");
        assertThat(publicEvents.statusCode()).isEqualTo(200);
        assertThat(publicEvents.body()).contains("Gallery event " + suffix, "People gathered at the community hall");
        assertThat(send("DELETE", "/api/v1/admin/events/" + eventId, null, true).statusCode())
                .isEqualTo(204);

        assertThat(send("DELETE", "/api/v1/admin/gallery/images/" + firstImageId, null, true).statusCode())
                .isEqualTo(204);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT deleted FROM gallery_images WHERE id = ?",
                Boolean.class,
                firstImageId)).isTrue();
        assertThat(send("/api/v1/gallery/albums?category=" + category).body())
                .doesNotContain("Neighbourhood gathering");

        assertThat(send("DELETE", "/api/v1/admin/gallery/albums/" + albumId, null, true).statusCode())
                .isEqualTo(204);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT deleted FROM gallery_albums WHERE id = ?",
                Boolean.class,
                albumId)).isTrue();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM gallery_images WHERE album_id = ? AND deleted = FALSE",
                Integer.class,
                albumId)).isZero();
        assertThat(send("/api/v1/gallery/albums?category=" + category).body()).isEqualTo("[]");
    }

    @Test
    void shouldDisplayPublishedEditionAlbumImagesOnTheFestivalPage() throws Exception {
        String suffix = UUID.randomUUID().toString();
        String slug = "gallery-festival-" + suffix;
        Map<String, Object> festival = new LinkedHashMap<>();
        festival.put("name", "Gallery festival " + suffix);
        festival.put("slug", slug);
        festival.put("description", "A published festival profile.");
        festival.put("history", null);
        festival.put("coverImageUrl", null);
        festival.put("published", true);
        HttpResponse<String> createdFestival = send(
                "POST",
                "/api/v1/admin/festivals",
                toJson(festival),
                true);
        assertThat(createdFestival.statusCode()).isEqualTo(201);
        long festivalId = objectMapper.readTree(createdFestival.body()).get("id").asLong();

        Map<String, Object> edition = new LinkedHashMap<>();
        edition.put("year", 2040);
        edition.put("theme", "Administrator-provided theme");
        edition.put("description", "A published edition.");
        edition.put("featuredHighlights", null);
        edition.put("startDate", LocalDate.of(2040, 10, 10).toString());
        edition.put("endDate", LocalDate.of(2040, 10, 12).toString());
        edition.put("venue", "Club venue");
        edition.put("address", null);
        edition.put("published", true);
        edition.put("eventIds", List.of());
        edition.put("galleryImageIds", List.of());
        edition.put("sponsorIds", List.of());
        HttpResponse<String> createdEdition = send(
                "POST",
                "/api/v1/admin/festivals/" + festivalId + "/editions",
                toJson(edition),
                true);
        assertThat(createdEdition.statusCode()).isEqualTo(201);
        long editionId = objectMapper.readTree(createdEdition.body()).get("id").asLong();
        long albumId = createAlbum(
                "Festival edition photos " + suffix,
                "festival-" + suffix,
                null,
                editionId);
        JsonNode uploaded = objectMapper.readTree(upload(albumId, true, pngImage()).body()).get(0);
        long imageId = uploaded.get("id").asLong();

        Map<String, Object> metadata = new LinkedHashMap<>();
        metadata.put("albumId", albumId);
        metadata.put("title", "Edition image");
        metadata.put("caption", null);
        metadata.put("altText", "An image associated with the published edition");
        metadata.put("displayOrder", 0);
        metadata.put("published", true);
        assertThat(send(
                "PUT",
                "/api/v1/admin/gallery/images/" + imageId,
                toJson(metadata),
                true).statusCode()).isEqualTo(200);
        Map<String, Object> publishedAlbum = albumRequest(
                "Festival edition photos " + suffix,
                "festival-" + suffix,
                true);
        publishedAlbum.put("festivalEditionId", editionId);
        publishedAlbum.put("coverImageId", imageId);
        assertThat(send(
                "PUT",
                "/api/v1/admin/gallery/albums/" + albumId,
                toJson(publishedAlbum),
                true).statusCode()).isEqualTo(200);

        HttpResponse<String> publicFestival = send("/api/v1/festivals/" + slug);
        assertThat(publicFestival.statusCode()).isEqualTo(200);
        assertThat(publicFestival.body())
                .contains(
                        "Edition image",
                        "\"altText\":\"An image associated with the published edition\"");
    }

    private long createAlbum(String title, String category, Long eventId) throws Exception {
        return createAlbum(title, category, eventId, null);
    }

    private long createAlbum(String title, String category, Long eventId, Long editionId) throws Exception {
        Map<String, Object> request = albumRequest(title, category, false);
        request.put("eventId", eventId);
        request.put("festivalEditionId", editionId);
        HttpResponse<String> response = send("POST", "/api/v1/admin/gallery/albums", toJson(request), true);
        assertThat(response.statusCode()).isEqualTo(201).withFailMessage(response.body());
        return objectMapper.readTree(response.body()).get("id").asLong();
    }

    private Map<String, Object> albumRequest(String title, String category, boolean published) {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("title", title);
        request.put("description", "Album description.");
        request.put("category", category);
        request.put("coverImageId", null);
        request.put("eventId", null);
        request.put("initiativeId", null);
        request.put("festivalEditionId", null);
        request.put("published", published);
        return request;
    }

    private long createEvent(String title) throws Exception {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("title", title);
        request.put("shortDescription", "A gallery event.");
        request.put("description", "An event with an associated album.");
        request.put("eventType", "community");
        request.put("status", "UPCOMING");
        request.put("startAt", "2040-10-10T10:00:00");
        request.put("endAt", "2040-10-10T12:00:00");
        request.put("venue", "Club grounds");
        request.put("address", null);
        request.put("capacity", null);
        request.put("imageUrl", null);
        request.put("published", true);
        HttpResponse<String> response = send(
                "POST",
                "/api/v1/admin/events",
                toJson(request),
                true);
        assertThat(response.statusCode()).isEqualTo(201).withFailMessage(response.body());
        return objectMapper.readTree(response.body()).get("id").asLong();
    }

    private HttpResponse<String> upload(long albumId, boolean authenticated, byte[]... images) throws Exception {
        String boundary = "gallery-" + UUID.randomUUID();
        ByteArrayOutputStream requestBody = new ByteArrayOutputStream();
        for (int index = 0; index < images.length; index++) {
            requestBody.write(("--" + boundary + "\r\n"
                    + "Content-Disposition: form-data; name=\"files\"; filename=\"photo-" + index + ".png\"\r\n"
                    + "Content-Type: image/png\r\n\r\n").getBytes(StandardCharsets.UTF_8));
            requestBody.write(images[index]);
            requestBody.write("\r\n".getBytes(StandardCharsets.UTF_8));
        }
        requestBody.write(("--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8));

        HttpRequest.Builder request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port
                        + "/api/v1/admin/gallery/albums/" + albumId + "/images"))
                .header("Accept", "application/json")
                .header("Content-Type", "multipart/form-data; boundary=" + boundary);
        if (authenticated) {
            request.header("Authorization", ADMIN_AUTHORIZATION);
        }
        return httpClient.send(
                request.POST(HttpRequest.BodyPublishers.ofByteArray(requestBody.toByteArray())).build(),
                HttpResponse.BodyHandlers.ofString());
    }

    private byte[] pngImage() throws Exception {
        ByteArrayOutputStream output = new ByteArrayOutputStream();
        ImageIO.write(new BufferedImage(2, 2, BufferedImage.TYPE_INT_RGB), "png", output);
        return output.toByteArray();
    }

    private String toJson(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
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

    @TestConfiguration
    static class StorageTestConfiguration {

        @Bean
        @Primary
        GalleryObjectStorage galleryObjectStorage() {
            return new TestGalleryObjectStorage();
        }
    }

    static class TestGalleryObjectStorage implements GalleryObjectStorage {
        private final Map<String, byte[]> objects = new LinkedHashMap<>();

        @Override
        public synchronized void upload(String key, byte[] contents, String contentType) {
            objects.put(key, contents.clone());
        }

        @Override
        public synchronized void delete(String key) {
            objects.remove(key);
        }

        @Override
        public String publicUrl(String key) {
            return "https://gallery.example.test/" + key;
        }
    }
}
