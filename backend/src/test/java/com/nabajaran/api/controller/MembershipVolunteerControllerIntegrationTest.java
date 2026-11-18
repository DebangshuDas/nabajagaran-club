package com.nabajaran.api.controller;

import static org.assertj.core.api.Assertions.assertThat;

import java.net.URI;
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
class MembershipVolunteerControllerIntegrationTest {

    private static final String ADMIN_AUTHORIZATION = "Basic " + Base64.getEncoder()
            .encodeToString("admin:test-admin-password".getBytes(StandardCharsets.UTF_8));

    private final HttpClient httpClient = HttpClient.newHttpClient();

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @LocalServerPort
    private int port;

    @AfterEach
    void cleanUpWorkflowRecords() {
        jdbcTemplate.update("""
                DELETE FROM volunteers
                WHERE volunteer_registration_id IN (
                    SELECT id FROM volunteer_registrations WHERE email LIKE 'workflow-%@example.com')
                """);
        jdbcTemplate.update("DELETE FROM volunteer_registrations WHERE email LIKE 'workflow-%@example.com'");
        jdbcTemplate.update("DELETE FROM membership_applications WHERE email LIKE 'workflow-%@example.com'");
        jdbcTemplate.update("DELETE FROM members WHERE email LIKE 'workflow-%@example.com'");
        jdbcTemplate.update(
                "DELETE FROM membership_applications WHERE email = 'demo.member@example.com'");
    }

    @Test
    void publicSubmissionValidatesPersistsPendingAndReturnsNoPersonalInformation() throws Exception {
        Map<String, Object> invalidApplication = membershipRequest(email());
        invalidApplication.put("fullName", " ");
        HttpResponse<String> invalidResponse = send(
                "POST", "/api/v1/membership-applications", invalidApplication, false);
        assertThat(invalidResponse.statusCode()).isEqualTo(400);

        String membershipEmail = email();
        Map<String, Object> application = membershipRequest(membershipEmail);
        HttpResponse<String> applicationResponse = send(
                "POST", "/api/v1/membership-applications", application, false);
        assertThat(applicationResponse.statusCode()).isEqualTo(201);
        assertThat(applicationResponse.body())
                .contains("received")
                .doesNotContain(membershipEmail, "Applicant " + membershipEmail);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT status FROM membership_applications WHERE email = ?",
                String.class,
                membershipEmail)).isEqualTo("PENDING");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT full_name FROM membership_applications WHERE email = ?",
                String.class,
                membershipEmail)).isEqualTo("Applicant " + membershipEmail);

        HttpResponse<String> duplicateApplication = send(
                "POST", "/api/v1/membership-applications", application, false);
        assertThat(duplicateApplication.statusCode()).isEqualTo(409);

        String volunteerEmail = email();
        HttpResponse<String> volunteerResponse = send(
                "POST",
                "/api/v1/volunteer-registrations",
                volunteerRequest(volunteerEmail),
                false);
        assertThat(volunteerResponse.statusCode()).isEqualTo(201);
        assertThat(volunteerResponse.body())
                .contains("received")
                .doesNotContain(volunteerEmail, "Volunteer " + volunteerEmail);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT status FROM volunteer_registrations WHERE email = ?",
                String.class,
                volunteerEmail)).isEqualTo("PENDING");

        Map<String, Object> automatedSubmission = volunteerRequest(email());
        automatedSubmission.put("companyWebsite", "https://spam.example");
        assertThat(send(
                "POST", "/api/v1/volunteer-registrations", automatedSubmission, false).statusCode())
                .isEqualTo(400);
    }

    @Test
    void legacyPendingRegistrationWithoutPendingEmailStillBlocksDuplicateSubmission() throws Exception {
        assertThat(jdbcTemplate.queryForObject(
                "SELECT pending_email FROM volunteer_registrations WHERE email = ?",
                String.class,
                "demo.volunteer@example.com")).isNull();

        HttpResponse<String> response = send(
                "POST",
                "/api/v1/volunteer-registrations",
                volunteerRequest("DEMO.VOLUNTEER@EXAMPLE.COM"),
                false);

        assertThat(response.statusCode()).isEqualTo(409);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM volunteer_registrations WHERE LOWER(email) = LOWER(?)",
                Integer.class,
                "demo.volunteer@example.com")).isEqualTo(1);
    }

    @Test
    void membershipApprovalCreatesOneMemberAndRejectionPreservesApplication() throws Exception {
        String approvedEmail = email();
        submitMembership(approvedEmail);
        long applicationId = membershipApplicationId(approvedEmail);

        HttpResponse<String> approval = send(
                "PATCH",
                "/api/v1/admin/membership-applications/" + applicationId + "/approve",
                Map.of(
                        "firstName", "Chosen",
                        "lastName", "Name",
                        "internalNotes", "Reviewed by admin"),
                true);
        assertThat(approval.statusCode()).isEqualTo(200);
        assertThat(approval.body()).contains(
                "\"fullName\":\"Applicant " + approvedEmail + "\"",
                "\"status\":\"APPROVED\"",
                "\"reviewedBy\":\"admin\"");
        long memberId = jsonLong(approval.body(), "memberId");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT first_name FROM members WHERE id = ?", String.class, memberId)).isEqualTo("Chosen");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT last_name FROM members WHERE id = ?", String.class, memberId)).isEqualTo("Name");

        assertThat(send(
                "PATCH",
                "/api/v1/admin/membership-applications/" + applicationId + "/approve",
                Map.of("firstName", "Other", "lastName", "Name"),
                true).statusCode()).isEqualTo(409);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM members WHERE email = ?", Integer.class, approvedEmail)).isEqualTo(1);

        String rejectedEmail = email();
        submitMembership(rejectedEmail);
        long rejectedId = membershipApplicationId(rejectedEmail);
        HttpResponse<String> rejection = send(
                "PATCH",
                "/api/v1/admin/membership-applications/" + rejectedId + "/reject",
                null,
                true);
        assertThat(rejection.statusCode()).isEqualTo(200);
        assertThat(rejection.body()).contains("\"status\":\"REJECTED\"");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM membership_applications WHERE email = ?",
                Integer.class,
                rejectedEmail)).isEqualTo(1);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM members WHERE email = ?", Integer.class, rejectedEmail)).isZero();
    }

    @Test
    void membershipApprovalConflictRollsBackAndMemberApisFilterSoftDeletedRows() throws Exception {
        String existingMemberEmail = "demo.member@example.com";
        submitMembership(existingMemberEmail);
        long applicationId = membershipApplicationId(existingMemberEmail);

        HttpResponse<String> conflict = send(
                "PATCH",
                "/api/v1/admin/membership-applications/" + applicationId + "/approve",
                Map.of("firstName", "Another", "lastName", "Member"),
                true);
        assertThat(conflict.statusCode()).isEqualTo(409);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT status FROM membership_applications WHERE id = ?",
                String.class,
                applicationId)).isEqualTo("PENDING");

        assertThat(send("GET", "/api/v1/admin/members", null, false).statusCode()).isEqualTo(401);
        assertThat(send("GET", "/api/v1/admin/members", null, true).statusCode()).isEqualTo(200);

        String deletedEmail = email();
        submitMembership(deletedEmail);
        long deletedId = membershipApplicationId(deletedEmail);
        jdbcTemplate.update(
                "UPDATE membership_applications SET deleted = TRUE, deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
                deletedId);
        assertThat(send(
                "GET",
                "/api/v1/admin/membership-applications/" + deletedId,
                null,
                true).statusCode()).isEqualTo(404);
        HttpResponse<String> list = send(
                "GET", "/api/v1/admin/membership-applications?search=" + deletedEmail, null, true);
        assertThat(list.body()).doesNotContain(deletedEmail);
    }

    @Test
    void volunteerApprovalRejectionAndStatusUpdatesDoNotDuplicateRecords() throws Exception {
        String approvedEmail = email();
        submitVolunteer(approvedEmail);
        long registrationId = volunteerRegistrationId(approvedEmail);

        assertThat(send(
                "GET", "/api/v1/admin/volunteer-registrations", null, false).statusCode()).isEqualTo(401);
        HttpResponse<String> approval = send(
                "PATCH",
                "/api/v1/admin/volunteer-registrations/" + registrationId + "/approve",
                Map.of("internalNotes", "Welcome"),
                true);
        assertThat(approval.statusCode()).isEqualTo(200);
        assertThat(approval.body()).contains("\"status\":\"APPROVED\"", "\"reviewedBy\":\"admin\"");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM volunteers v JOIN volunteer_registrations r "
                        + "ON r.id = v.volunteer_registration_id WHERE r.id = ?",
                Integer.class,
                registrationId)).isEqualTo(1);

        assertThat(send(
                "PATCH",
                "/api/v1/admin/volunteer-registrations/" + registrationId + "/approve",
                null,
                true).statusCode()).isEqualTo(409);
        long volunteerId = jdbcTemplate.queryForObject(
                "SELECT id FROM volunteers WHERE volunteer_registration_id = ?",
                Long.class,
                registrationId);
        HttpResponse<String> inactive = send(
                "PATCH",
                "/api/v1/admin/volunteers/" + volunteerId + "/status",
                Map.of("status", "INACTIVE"),
                true);
        assertThat(inactive.statusCode()).isEqualTo(200);
        assertThat(inactive.body()).contains("\"status\":\"INACTIVE\"");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT deactivated_at IS NOT NULL FROM volunteers WHERE id = ?",
                Boolean.class,
                volunteerId)).isTrue();

        String rejectedEmail = email();
        submitVolunteer(rejectedEmail);
        long rejectedId = volunteerRegistrationId(rejectedEmail);
        HttpResponse<String> rejection = send(
                "PATCH",
                "/api/v1/admin/volunteer-registrations/" + rejectedId + "/reject",
                null,
                true);
        assertThat(rejection.statusCode()).isEqualTo(200);
        assertThat(rejection.body()).contains("\"status\":\"REJECTED\"");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM volunteers v JOIN volunteer_registrations r "
                        + "ON r.id = v.volunteer_registration_id WHERE r.id = ?",
                Integer.class,
                rejectedId)).isZero();
    }

    @Test
    void volunteerAdminViewsExcludeSoftDeletedRegistrationsAndVolunteers() throws Exception {
        String deletedRegistrationEmail = email();
        submitVolunteer(deletedRegistrationEmail);
        long deletedRegistrationId = volunteerRegistrationId(deletedRegistrationEmail);
        jdbcTemplate.update(
                "UPDATE volunteer_registrations SET deleted = TRUE, deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
                deletedRegistrationId);

        assertThat(send(
                "GET",
                "/api/v1/admin/volunteer-registrations/" + deletedRegistrationId,
                null,
                true).statusCode()).isEqualTo(404);
        assertThat(send(
                "GET",
                "/api/v1/admin/volunteer-registrations?search=" + deletedRegistrationEmail,
                null,
                true).body()).doesNotContain(deletedRegistrationEmail);

        String deletedVolunteerEmail = email();
        submitVolunteer(deletedVolunteerEmail);
        long registrationId = volunteerRegistrationId(deletedVolunteerEmail);
        assertThat(send(
                "PATCH",
                "/api/v1/admin/volunteer-registrations/" + registrationId + "/approve",
                null,
                true).statusCode()).isEqualTo(200);
        long volunteerId = jdbcTemplate.queryForObject(
                "SELECT id FROM volunteers WHERE volunteer_registration_id = ?",
                Long.class,
                registrationId);
        jdbcTemplate.update(
                "UPDATE volunteers SET deleted = TRUE, deleted_at = CURRENT_TIMESTAMP WHERE id = ?",
                volunteerId);

        assertThat(send(
                "GET",
                "/api/v1/admin/volunteers/" + volunteerId,
                null,
                true).statusCode()).isEqualTo(404);
        assertThat(send(
                "GET",
                "/api/v1/admin/volunteers?search=" + deletedVolunteerEmail,
                null,
                true).body()).doesNotContain(deletedVolunteerEmail);
    }

    private void submitMembership(String email) throws Exception {
        assertThat(send("POST", "/api/v1/membership-applications", membershipRequest(email), false)
                .statusCode()).isEqualTo(201);
    }

    private void submitVolunteer(String email) throws Exception {
        assertThat(send("POST", "/api/v1/volunteer-registrations", volunteerRequest(email), false)
                .statusCode()).isEqualTo(201);
    }

    private long membershipApplicationId(String email) {
        return jdbcTemplate.queryForObject(
                "SELECT id FROM membership_applications WHERE email = ?", Long.class, email);
    }

    private long volunteerRegistrationId(String email) {
        return jdbcTemplate.queryForObject(
                "SELECT id FROM volunteer_registrations WHERE email = ?", Long.class, email);
    }

    private Map<String, Object> membershipRequest(String email) {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("fullName", "Applicant " + email);
        request.put("email", email);
        request.put("phone", "555-0101");
        request.put("address", "Example address");
        request.put("occupation", "Teacher");
        request.put("reasonForJoining", "I would like to take part.");
        request.put("additionalMessage", "Additional information.");
        return request;
    }

    private Map<String, Object> volunteerRequest(String email) {
        Map<String, Object> request = new LinkedHashMap<>();
        request.put("fullName", "Volunteer " + email);
        request.put("email", email);
        request.put("phone", "555-0102");
        request.put("preferredRoles", "Event support");
        request.put("availability", "Weekends");
        request.put("motivation", "I can help.");
        return request;
    }

    private String email() {
        return "workflow-" + UUID.randomUUID() + "@example.com";
    }

    private HttpResponse<String> send(
            String method, String path, Map<String, Object> body, boolean authenticated) throws Exception {
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
                                : HttpRequest.BodyPublishers.ofString(toJson(body)))
                        .build(),
                HttpResponse.BodyHandlers.ofString());
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

    private long jsonLong(String json, String field) {
        Matcher matcher = Pattern.compile(
                "\"" + Pattern.quote(field) + "\"\\s*:\\s*(-?\\d+)")
                .matcher(json);
        assertThat(matcher.find()).as("JSON field %s", field).isTrue();
        return Long.parseLong(matcher.group(1));
    }
}
