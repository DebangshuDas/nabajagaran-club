INSERT INTO club_information (
    name, tagline, description, mission, founding_year, address, city, state, country,
    postal_code, email, phone, website, facebook_url, instagram_url,
    created_at, updated_at, deleted, deleted_at
)
SELECT
    'nabajagaran-club',
    'Celebrating culture, community, and belonging',
    'A demo profile for the nabajagaran-club community website.',
    'To build a connected and inclusive community through cultural events and service.',
    2008,
    '123 Demo Street',
    'Demo City',
    'Demo State',
    'Demo Country',
    '00000',
    'hello@example.com',
    '000-000-0000',
    'https://example.com/nabajagaran-club',
    'https://example.com/nabajagaran-club/facebook',
    'https://example.com/nabajagaran-club/instagram',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    FALSE,
    NULL
WHERE NOT EXISTS (SELECT 1 FROM club_information);

INSERT INTO club_info (
    club_name, tagline, description, mission, founded_year, address, city, state, country,
    postal_code, email, phone, website, facebook_url, instagram_url, created_at, updated_at
)
SELECT
    'nabajagaran-club',
    'Celebrating culture, community, and belonging',
    'A demo profile for the nabajagaran-club community website.',
    'To build a connected and inclusive community through cultural events and service.',
    2008,
    '123 Demo Street',
    'Demo City',
    'Demo State',
    'Demo Country',
    '00000',
    'hello@example.com',
    '000-000-0000',
    'https://example.com/nabajagaran-club',
    'https://example.com/nabajagaran-club/facebook',
    'https://example.com/nabajagaran-club/instagram',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
WHERE NOT EXISTS (SELECT 1 FROM club_info);

UPDATE club_information
SET name = 'nabajagaran-club'
WHERE name = 'Nabajaran Club';

UPDATE club_info
SET club_name = 'nabajagaran-club'
WHERE club_name = 'Nabajaran Club';

INSERT INTO business_categories (
    name, slug, description, is_active, created_at, updated_at, deleted, deleted_at
)
SELECT
    'Community Services',
    'community-services',
    'Demo category for community-oriented businesses and services.',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    FALSE,
    NULL
WHERE NOT EXISTS (
    SELECT 1 FROM business_categories WHERE slug = 'community-services'
);

INSERT INTO members (
    first_name, last_name, email, phone, membership_status, join_date, expiry_date, notes,
    is_public_profile, created_at, updated_at, deleted, deleted_at
)
SELECT
    'Demo',
    'Member',
    'demo.member@example.com',
    NULL,
    'ACTIVE',
    CURRENT_DATE,
    NULL,
    'Sample member record. Replace or remove this demo data as needed.',
    FALSE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    FALSE,
    NULL
WHERE NOT EXISTS (
    SELECT 1 FROM members WHERE email = 'demo.member@example.com'
);

INSERT INTO events (
    club_information_id, title, slug, description, short_description, event_type, status,
    start_at, end_at, venue, address, is_published, capacity, image_url,
    created_at, updated_at, deleted, deleted_at
)
SELECT
    (SELECT id FROM club_information ORDER BY id LIMIT 1),
    'Community Welcome Gathering',
    'demo-community-welcome-gathering',
    'A sample gathering for neighbors to meet, share food, and celebrate community.',
    'Meet neighbors and celebrate community.',
    'community',
    'UPCOMING',
    CURRENT_TIMESTAMP + INTERVAL '30' DAY,
    CURRENT_TIMESTAMP + INTERVAL '30' DAY + INTERVAL '2' HOUR,
    'Demo Community Hall',
    '123 Demo Street, Demo City',
    TRUE,
    100,
    '/images/demo-community-gathering.jpg',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    FALSE,
    NULL
WHERE EXISTS (SELECT 1 FROM club_information)
  AND NOT EXISTS (
      SELECT 1 FROM events WHERE slug = 'demo-community-welcome-gathering'
  );

INSERT INTO announcements (
    club_information_id, title, content, is_published, published_at, audience,
    created_at, updated_at, deleted, deleted_at
)
SELECT
    (SELECT id FROM club_information ORDER BY id LIMIT 1),
    'Welcome to the community',
    'This is a sample announcement. Check back for community news and event updates.',
    TRUE,
    CURRENT_TIMESTAMP,
    'public',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    FALSE,
    NULL
WHERE EXISTS (SELECT 1 FROM club_information)
  AND NOT EXISTS (
      SELECT 1 FROM announcements WHERE title = 'Welcome to the community'
  );

INSERT INTO businesses (
    club_information_id, category_id, name, slug, description, website, email, phone,
    address, city, state, country, postal_code, latitude, longitude, approval_status,
    is_featured, is_active, created_at, updated_at, deleted, deleted_at
)
SELECT
    (SELECT id FROM club_information ORDER BY id LIMIT 1),
    (SELECT id FROM business_categories WHERE slug = 'community-services'),
    'Demo Community Cafe',
    'demo-community-cafe',
    'A sample listing for the club directory.',
    'https://example.com/community-cafe',
    'cafe@example.com',
    NULL,
    '123 Demo Street',
    'Demo City',
    'Demo State',
    'Demo Country',
    '00000',
    NULL,
    NULL,
    'APPROVED',
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    FALSE,
    NULL
WHERE EXISTS (SELECT 1 FROM club_information)
  AND EXISTS (
      SELECT 1 FROM business_categories WHERE slug = 'community-services'
  )
  AND NOT EXISTS (
      SELECT 1 FROM businesses WHERE slug = 'demo-community-cafe'
  );

INSERT INTO community_initiatives (
    club_information_id, title, description, start_date, end_date, location, contact_email,
    status, created_at, updated_at, deleted, deleted_at
)
SELECT
    (SELECT id FROM club_information ORDER BY id LIMIT 1),
    'Neighborhood Welcome Project',
    'A sample initiative to help new neighbors connect with local community resources.',
    CURRENT_DATE,
    NULL,
    'Demo City',
    'hello@example.com',
    'active',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    FALSE,
    NULL
WHERE EXISTS (SELECT 1 FROM club_information)
  AND NOT EXISTS (
      SELECT 1 FROM community_initiatives WHERE title = 'Neighborhood Welcome Project'
  );

INSERT INTO sponsors (
    club_information_id, name, slug, logo_url, website, sponsor_tier, description,
    is_featured, is_active, created_at, updated_at, deleted, deleted_at
)
SELECT
    (SELECT id FROM club_information ORDER BY id LIMIT 1),
    'Community Supporter',
    'demo-community-supporter',
    '/images/demo-sponsor-logo.svg',
    'https://example.com/community-supporter',
    'community',
    'A sample community sponsor entry.',
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    FALSE,
    NULL
WHERE EXISTS (SELECT 1 FROM club_information)
  AND NOT EXISTS (
      SELECT 1 FROM sponsors WHERE slug = 'demo-community-supporter'
  );

INSERT INTO gallery_images (
    club_information_id, title, caption, image_url, alt_text, category, is_public,
    created_at, updated_at, deleted, deleted_at
)
SELECT
    (SELECT id FROM club_information ORDER BY id LIMIT 1),
    'Community Gathering',
    'A placeholder image entry for a community gathering.',
    '/images/demo-community-gathering.jpg',
    'Placeholder for a community gathering',
    'community',
    TRUE,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    FALSE,
    NULL
WHERE EXISTS (SELECT 1 FROM club_information)
  AND NOT EXISTS (
      SELECT 1 FROM gallery_images WHERE image_url = '/images/demo-community-gathering.jpg'
  );

INSERT INTO contact_messages (
    club_information_id, name, email, phone, subject, message, status,
    created_at, updated_at, deleted, deleted_at
)
SELECT
    (SELECT id FROM club_information ORDER BY id LIMIT 1),
    'Demo Visitor',
    'visitor@example.com',
    NULL,
    'Sample inquiry',
    'This is a sample contact message for development and testing.',
    'new',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    FALSE,
    NULL
WHERE EXISTS (SELECT 1 FROM club_information)
  AND NOT EXISTS (
      SELECT 1 FROM contact_messages WHERE email = 'visitor@example.com'
  );

INSERT INTO volunteer_registrations (
    member_id, full_name, email, phone, preferred_roles, availability, motivation, status,
    created_at, updated_at, deleted, deleted_at
)
SELECT
    (SELECT id FROM members WHERE email = 'demo.member@example.com'),
    'Demo Volunteer',
    'demo.volunteer@example.com',
    NULL,
    'Event setup, community outreach',
    'Available on weekends',
    'Sample volunteer record for development and testing.',
    'pending',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP,
    FALSE,
    NULL
WHERE EXISTS (
    SELECT 1 FROM members WHERE email = 'demo.member@example.com'
)
  AND NOT EXISTS (
      SELECT 1 FROM volunteer_registrations WHERE email = 'demo.volunteer@example.com'
  );
