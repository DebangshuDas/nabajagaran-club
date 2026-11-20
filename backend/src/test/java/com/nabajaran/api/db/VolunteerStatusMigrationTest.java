package com.nabajaran.api.db;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.sql.Timestamp;
import java.time.LocalDateTime;
import java.util.UUID;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.FlywayException;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.Test;

class VolunteerStatusMigrationTest {

    @Test
    void backfillsApprovedLegacyRegistrationsAndPreservesLegacyData() throws Exception {
        String url = newDatabaseUrl();
        migrateToVersionSeven(url);

        long memberId;
        long approvedId;
        long deletedApprovedId;
        long uniquePendingId;
        long duplicatePendingId;
        long duplicatePendingIdTwo;
        long rejectedId;
        Timestamp deletedAt = Timestamp.valueOf(LocalDateTime.of(2020, 1, 2, 3, 4));
        try (var connection = DriverManager.getConnection(url, "sa", "")) {
            memberId = insertMember(connection, "legacy-member@example.com");
            approvedId = insertRegistration(
                    connection, "Legacy Approved", "approved@example.com", "approved", memberId, false, null);
            deletedApprovedId = insertRegistration(
                    connection, "Deleted Approved", "deleted-approved@example.com", "APPROVED", null, true, deletedAt);
            uniquePendingId = insertRegistration(
                    connection, "Unique Pending", "legacy-pending@example.com", "pending", memberId, false, null);
            duplicatePendingId = insertRegistration(
                    connection, "Duplicate Pending One", "duplicate@example.com", "PENDING", null, false, null);
            duplicatePendingIdTwo = insertRegistration(
                    connection, "Duplicate Pending Two", " DUPLICATE@example.com ", "pending", null, false, null);
            rejectedId = insertRegistration(
                    connection, "Legacy Rejected", "rejected@example.com", "rejected", null, false, null);
        }

        migrateToLatest(url);

        try (var connection = DriverManager.getConnection(url, "sa", "")) {
            assertThat(readString(
                    connection, "SELECT status FROM volunteer_registrations WHERE id = ?", approvedId))
                    .isEqualTo("APPROVED");
            assertThat(readString(
                    connection, "SELECT status FROM volunteer_registrations WHERE id = ?", uniquePendingId))
                    .isEqualTo("PENDING");
            assertThat(readString(
                    connection, "SELECT status FROM volunteer_registrations WHERE id = ?", rejectedId))
                    .isEqualTo("REJECTED");

            assertThat(readLong(connection, "SELECT COUNT(*) FROM volunteers")).isEqualTo(2);
            assertThat(readString(connection, """
                    SELECT v.status
                    FROM volunteers v
                    WHERE v.volunteer_registration_id = ?
                    """, approvedId)).isEqualTo("INACTIVE");
            assertThat(readLong(connection, """
                    SELECT COUNT(*)
                    FROM volunteers
                    WHERE volunteer_registration_id IN (?, ?)
                      AND activated_at IS NULL
                    """, approvedId, deletedApprovedId)).isEqualTo(2);
            assertThat(readLong(connection, """
                    SELECT COUNT(*)
                    FROM volunteers
                    WHERE volunteer_registration_id IN (?, ?)
                      AND created_at IS NOT NULL
                      AND updated_at IS NOT NULL
                    """, approvedId, deletedApprovedId)).isEqualTo(2);

            assertThat(readLong(connection,
                    "SELECT member_id FROM volunteer_registrations WHERE id = ?", approvedId))
                    .isEqualTo(memberId);
            assertThat(readLong(connection, """
                    SELECT COUNT(*)
                    FROM volunteers v
                    JOIN volunteer_registrations r ON r.id = v.volunteer_registration_id
                    WHERE v.volunteer_registration_id = ?
                      AND r.member_id = ?
                    """, approvedId, memberId)).isEqualTo(1);
            assertThat(readLong(connection, """
                    SELECT COUNT(*)
                    FROM volunteers
                    WHERE volunteer_registration_id = ?
                      AND deleted = TRUE
                      AND deleted_at = ?
                    """, deletedApprovedId, deletedAt)).isEqualTo(1);

            assertThat(readLong(connection, """
                    SELECT COUNT(*)
                    FROM volunteers
                    WHERE volunteer_registration_id IN (?, ?)
                    """, uniquePendingId, rejectedId)).isZero();
            assertThat(readString(
                    connection, "SELECT pending_email FROM volunteer_registrations WHERE id = ?", uniquePendingId))
                    .isEqualTo("legacy-pending@example.com");
            assertThat(readLong(connection, """
                    SELECT COUNT(*)
                    FROM volunteer_registrations
                    WHERE id IN (?, ?) AND pending_email IS NULL
                    """, duplicatePendingId, duplicatePendingIdTwo)).isEqualTo(2);

            int repeatBackfillCount;
            try (var statement = connection.createStatement()) {
                repeatBackfillCount = statement.executeUpdate("""
                        INSERT INTO volunteers (
                            volunteer_registration_id, status, activated_at, deactivated_at,
                            created_at, updated_at, deleted, deleted_at
                        )
                        SELECT registration.id, 'INACTIVE', NULL, NULL,
                               CURRENT_TIMESTAMP, CURRENT_TIMESTAMP,
                               registration.deleted, registration.deleted_at
                        FROM volunteer_registrations registration
                        WHERE registration.status = 'APPROVED'
                          AND NOT EXISTS (
                              SELECT 1
                              FROM volunteers existing
                              WHERE existing.volunteer_registration_id = registration.id
                          )
                        """);
            }
            assertThat(repeatBackfillCount).isZero();
            assertThat(readLong(connection, "SELECT COUNT(*) FROM volunteers")).isEqualTo(2);

            assertThatThrownBy(() -> insertVolunteer(connection, approvedId))
                    .isInstanceOf(SQLException.class);
        }
    }

    @Test
    void failsOnUnexpectedLegacyStatusWithoutChangingTheRegistration() throws Exception {
        String url = newDatabaseUrl();
        migrateToVersionSeven(url);
        long registrationId;
        try (var connection = DriverManager.getConnection(url, "sa", "")) {
            registrationId = insertRegistration(
                    connection, "Unexpected Status", "unexpected@example.com", "ACTIVE", null, false, null);
        }

        assertThatThrownBy(() -> migrateToLatest(url)).isInstanceOf(FlywayException.class);

        try (var connection = DriverManager.getConnection(url, "sa", "")) {
            assertThat(readLong(connection, "SELECT COUNT(*) FROM volunteer_registrations WHERE id = ?", registrationId))
                    .isEqualTo(1);
            assertThat(readString(
                    connection, "SELECT status FROM volunteer_registrations WHERE id = ?", registrationId))
                    .isEqualTo("ACTIVE");
        }
    }

    private static String newDatabaseUrl() {
        return "jdbc:h2:mem:volunteer_migration_" + UUID.randomUUID().toString().replace("-", "")
                + ";MODE=PostgreSQL;DB_CLOSE_DELAY=-1";
    }

    private static void migrateToVersionSeven(String url) {
        Flyway.configure()
                .dataSource(url, "sa", "")
                .locations("classpath:db/migration")
                .target(MigrationVersion.fromVersion("7"))
                .load()
                .migrate();
    }

    private static void migrateToLatest(String url) {
        Flyway.configure()
                .dataSource(url, "sa", "")
                .locations("classpath:db/migration")
                .load()
                .migrate();
    }

    private static long insertMember(Connection connection, String email) throws SQLException {
        try (var statement = connection.prepareStatement("""
                INSERT INTO members (
                    first_name, last_name, email, membership_status, is_public_profile,
                    created_at, updated_at, deleted
                ) VALUES ('Legacy', 'Member', ?, 'ACTIVE', FALSE,
                          CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE)
                """, Statement.RETURN_GENERATED_KEYS)) {
            statement.setString(1, email);
            statement.executeUpdate();
            try (ResultSet keys = statement.getGeneratedKeys()) {
                assertThat(keys.next()).isTrue();
                return keys.getLong(1);
            }
        }
    }

    private static long insertRegistration(
            Connection connection,
            String fullName,
            String email,
            String status,
            Long memberId,
            boolean deleted,
            Timestamp deletedAt) throws SQLException {
        try (var statement = connection.prepareStatement("""
                INSERT INTO volunteer_registrations (
                    member_id, full_name, email, status, created_at, updated_at, deleted, deleted_at
                ) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, ?, ?)
                """, Statement.RETURN_GENERATED_KEYS)) {
            statement.setObject(1, memberId);
            statement.setString(2, fullName);
            statement.setString(3, email);
            statement.setString(4, status);
            statement.setBoolean(5, deleted);
            statement.setTimestamp(6, deletedAt);
            statement.executeUpdate();
            try (ResultSet keys = statement.getGeneratedKeys()) {
                assertThat(keys.next()).isTrue();
                return keys.getLong(1);
            }
        }
    }

    private static void insertVolunteer(Connection connection, long registrationId) throws SQLException {
        try (var statement = connection.prepareStatement("""
                INSERT INTO volunteers (
                    volunteer_registration_id, status, activated_at, created_at, updated_at, deleted
                ) VALUES (?, 'INACTIVE', NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE)
                """)) {
            statement.setLong(1, registrationId);
            statement.executeUpdate();
        }
    }

    private static String readString(Connection connection, String sql, Object... parameters) throws SQLException {
        try (var statement = connection.prepareStatement(sql)) {
            setParameters(statement, parameters);
            try (ResultSet result = statement.executeQuery()) {
                assertThat(result.next()).isTrue();
                String value = result.getString(1);
                assertThat(result.next()).isFalse();
                return value;
            }
        }
    }

    private static long readLong(Connection connection, String sql, Object... parameters) throws SQLException {
        try (var statement = connection.prepareStatement(sql)) {
            setParameters(statement, parameters);
            try (ResultSet result = statement.executeQuery()) {
                assertThat(result.next()).isTrue();
                long value = result.getLong(1);
                assertThat(result.next()).isFalse();
                return value;
            }
        }
    }

    private static void setParameters(PreparedStatement statement, Object... parameters) throws SQLException {
        for (int index = 0; index < parameters.length; index++) {
            statement.setObject(index + 1, parameters[index]);
        }
    }
}
