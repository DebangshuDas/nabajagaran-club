INSERT INTO club_information (name, created_at, updated_at, deleted)
SELECT 'nabajagaran-club', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, FALSE
WHERE NOT EXISTS (SELECT 1 FROM club_information);
