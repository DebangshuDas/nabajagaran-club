ALTER TABLE community_initiatives ADD COLUMN slug VARCHAR(255);
ALTER TABLE community_initiatives ADD COLUMN category VARCHAR(100);
ALTER TABLE community_initiatives ADD COLUMN short_description VARCHAR(500);
ALTER TABLE community_initiatives ADD COLUMN image_url VARCHAR(255);
ALTER TABLE community_initiatives ADD COLUMN is_published BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE community_initiatives
SET slug = CONCAT('initiative-', id);

UPDATE community_initiatives
SET status = UPPER(status)
WHERE LOWER(status) IN ('planned', 'active', 'completed');

ALTER TABLE community_initiatives
    ALTER COLUMN slug SET NOT NULL;

ALTER TABLE community_initiatives
    ADD CONSTRAINT uk_community_initiatives_slug UNIQUE (slug);

CREATE INDEX idx_initiatives_published
    ON community_initiatives (is_published, deleted);

CREATE TABLE community_initiative_events (
    initiative_id BIGINT NOT NULL,
    event_id BIGINT NOT NULL,
    CONSTRAINT pk_community_initiative_events PRIMARY KEY (initiative_id, event_id),
    CONSTRAINT fk_community_initiative_events_initiative
        FOREIGN KEY (initiative_id) REFERENCES community_initiatives (id),
    CONSTRAINT fk_community_initiative_events_event
        FOREIGN KEY (event_id) REFERENCES events (id)
);

CREATE INDEX idx_community_initiative_events_event_id
    ON community_initiative_events (event_id);
