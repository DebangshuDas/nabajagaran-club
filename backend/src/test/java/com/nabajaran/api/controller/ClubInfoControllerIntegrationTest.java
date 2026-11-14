package com.nabajaran.api.controller;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.List;
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
class ClubInfoControllerIntegrationTest {

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
}
