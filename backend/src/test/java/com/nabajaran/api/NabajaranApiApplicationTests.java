package com.nabajaran.api;

import static org.assertj.core.api.Assertions.assertThat;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:nabajaran_migration_test;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE"
})
@ActiveProfiles("test")
class NabajaranApiApplicationTests {

	@Autowired
	private JdbcTemplate jdbcTemplate;

	@Test
	void contextLoads() {
	}

	@Test
	void seedsOnlyTheConfirmedClubIdentityInAnEmptyDatabase() {
		assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM club_information", Integer.class))
				.isEqualTo(1);
		assertThat(jdbcTemplate.queryForObject("SELECT name FROM club_information", String.class))
				.isEqualTo("nabajagaran-club");
		assertThat(jdbcTemplate.queryForObject("SELECT tagline FROM club_information", String.class))
				.isNull();
	}

}
