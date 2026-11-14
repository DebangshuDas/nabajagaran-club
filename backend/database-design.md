# Nabajaran Club Database Design

This schema is designed for a single-club platform with privacy-minded member data and public-facing listings.

## Design principles

- Keep member contact data private and only store what is needed.
- Use soft deletion for data that may need historical visibility or audit trails.
- Keep public content and moderation flows explicit with approval/status fields.
- Use timestamps on all mutable records.
- Prefer simple relational modeling over over-normalization.

## Shared conventions

- Every mutable table has:
  - `id` as primary key
  - `created_at` as UTC timestamp
  - `updated_at` as UTC timestamp
  - `deleted` boolean default `false`
  - `deleted_at` nullable timestamp for soft delete trails
- Use `TIMESTAMPTZ` / `TIMESTAMP WITH TIME ZONE` in PostgreSQL for timestamps.
- Use `VARCHAR` with explicit length limits for short text.
- Use `TEXT` for long-form descriptions and content.
- Use `ENUM` style values as `VARCHAR` with a checked application-level convention, storing values like `pending`, `active`, `inactive`, `upcoming`, `ongoing`, `completed`.

---

## 1) club_information

Purpose: stores the canonical public profile for the club.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK | Primary key |
| name | VARCHAR(150) | NOT NULL | Club name |
| tagline | VARCHAR(200) | NULL | Short public tagline |
| description | TEXT | NULL | Full description |
| mission | TEXT | NULL | Mission statement |
| founding_year | INTEGER | NULL | Foundation year |
| address | VARCHAR(255) | NULL | Public address |
| city | VARCHAR(100) | NULL | |
| state | VARCHAR(100) | NULL | |
| country | VARCHAR(100) | NULL | |
| postal_code | VARCHAR(20) | NULL | |
| email | VARCHAR(150) | NULL | Public email |
| phone | VARCHAR(50) | NULL | Public phone |
| website | VARCHAR(255) | NULL | |
| facebook_url | VARCHAR(255) | NULL | |
| instagram_url | VARCHAR(255) | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |
| deleted | BOOLEAN | NOT NULL default false | Soft delete flag |
| deleted_at | TIMESTAMPTZ | NULL | Soft delete timestamp |

Indexes:
- `idx_club_information_name` on `(name)`
- `idx_club_information_deleted` on `(deleted)`

Relationship:
- Usually a single-row configuration table. Other pubic tables may reference it when needed.

---

## 2) events

Purpose: public events and cultural programs.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK | |
| club_information_id | BIGINT | FK -> club_information(id), NOT NULL | Club scope |
| title | VARCHAR(200) | NOT NULL | |
| slug | VARCHAR(200) | NOT NULL, UNIQUE | URL friendly identifier |
| description | TEXT | NOT NULL | |
| short_description | VARCHAR(500) | NULL | |
| event_type | VARCHAR(50) | NOT NULL | e.g. festival, workshop, social, cultural |
| status | VARCHAR(30) | NOT NULL | upcoming, ongoing, completed |
| start_at | TIMESTAMPTZ | NOT NULL | |
| end_at | TIMESTAMPTZ | NULL | |
| venue | VARCHAR(255) | NULL | |
| address | VARCHAR(255) | NULL | |
| is_published | BOOLEAN | NOT NULL default false | |
| capacity | INTEGER | NULL | Number of seats |
| image_url | VARCHAR(255) | NULL | |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |
| deleted | BOOLEAN | NOT NULL default false | |
| deleted_at | TIMESTAMPTZ | NULL | |

Indexes:
- `idx_events_club_information_id` on `(club_information_id)`
- `idx_events_status` on `(status)`
- `idx_events_start_at` on `(start_at)`
- `idx_events_published` on `(is_published, deleted)`
- `idx_events_slug` on `(slug)` unique |

Relationships:
- Many events belong to one club.
- Event status supports `upcoming`, `ongoing`, `completed`.

---

## 3) announcements

Purpose: club-wide notices and important updates.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK | |
| club_information_id | BIGINT | FK -> club_information(id), NOT NULL | |
| title | VARCHAR(200) | NOT NULL | |
| content | TEXT | NOT NULL | |
| is_published | BOOLEAN | NOT NULL default false | |
| published_at | TIMESTAMPTZ | NULL | |
| audience | VARCHAR(50) | NULL | members, volunteers, public |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |
| deleted | BOOLEAN | NOT NULL default false | |
| deleted_at | TIMESTAMPTZ | NULL | |

Indexes:
- `idx_announcements_club_information_id` on `(club_information_id)`
- `idx_announcements_published` on `(is_published, published_at)`
- `idx_announcements_deleted` on `(deleted)`

---

## 4) members

Purpose: club membership records with minimal privacy-preserving contact data.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK | |
| first_name | VARCHAR(100) | NULL | Minimal identity |
| last_name | VARCHAR(100) | NULL | |
| email | VARCHAR(150) | NULL, UNIQUE | Private; only if consented |
| phone | VARCHAR(50) | NULL | Private, optional |
| membership_status | VARCHAR(20) | NOT NULL | pending, active, inactive |
| join_date | DATE | NULL | |
| expiry_date | DATE | NULL | |
| notes | TEXT | NULL | Internal notes only |
| is_public_profile | BOOLEAN | NOT NULL default false | Controls public exposure |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |
| deleted | BOOLEAN | NOT NULL default false | |
| deleted_at | TIMESTAMPTZ | NULL | |

Indexes:
- `idx_members_email` on `(email)` where `email IS NOT NULL`
- `idx_members_status` on `(membership_status)`
- `idx_members_deleted` on `(deleted)`

Privacy note:
- Do not store unnecessary personal data such as full addresses, DOB, government IDs, or payment details in this table.

---

## 5) volunteer_registrations

Purpose: volunteer interest and staffing requests.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK | |
| member_id | BIGINT | FK -> members(id), NULL | Optional if volunteer is not already a member |
| full_name | VARCHAR(150) | NOT NULL | |
| email | VARCHAR(150) | NOT NULL | Contact detail kept private |
| phone | VARCHAR(50) | NULL | |
| preferred_roles | TEXT | NULL | e.g. event setup, outreach |
| availability | TEXT | NULL | |
| motivation | TEXT | NULL | |
| status | VARCHAR(20) | NOT NULL default 'pending' | pending, approved, rejected |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |
| deleted | BOOLEAN | NOT NULL default false | |
| deleted_at | TIMESTAMPTZ | NULL | |

Indexes:
- `idx_volunteer_registrations_member_id` on `(member_id)`
- `idx_volunteer_registrations_status` on `(status)`
- `idx_volunteer_registrations_email` on `(email)`

---

## 6) business_categories

Purpose: category taxonomy for local business listings.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK | |
| name | VARCHAR(100) | NOT NULL | |
| slug | VARCHAR(100) | NOT NULL, UNIQUE | |
| description | TEXT | NULL | |
| is_active | BOOLEAN | NOT NULL default true | |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |
| deleted | BOOLEAN | NOT NULL default false | |
| deleted_at | TIMESTAMPTZ | NULL | |

Indexes:
- `idx_business_categories_slug` on `(slug)` unique
- `idx_business_categories_active` on `(is_active, deleted)`

---

## 7) businesses

Purpose: directory of local businesses and services.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK | |
| club_information_id | BIGINT | FK -> club_information(id), NOT NULL | |
| category_id | BIGINT | FK -> business_categories(id), NOT NULL | |
| name | VARCHAR(150) | NOT NULL | |
| slug | VARCHAR(150) | NOT NULL, UNIQUE | |
| description | TEXT | NULL | |
| website | VARCHAR(255) | NULL | |
| email | VARCHAR(150) | NULL | Public listing email |
| phone | VARCHAR(50) | NULL | Public phone |
| address | VARCHAR(255) | NULL | |
| city | VARCHAR(100) | NULL | |
| state | VARCHAR(100) | NULL | |
| country | VARCHAR(100) | NULL | |
| postal_code | VARCHAR(20) | NULL | |
| latitude | DECIMAL(9,6) | NULL | Optional geo info |
| longitude | DECIMAL(9,6) | NULL | Optional geo info |
| approval_status | VARCHAR(20) | NOT NULL default 'pending' | pending, approved, rejected |
| is_featured | BOOLEAN | NOT NULL default false | |
| is_active | BOOLEAN | NOT NULL default true | Publicly visible |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |
| deleted | BOOLEAN | NOT NULL default false | |
| deleted_at | TIMESTAMPTZ | NULL | |

Indexes:
- `idx_businesses_category_id` on `(category_id)`
- `idx_businesses_approval_status` on `(approval_status)`
- `idx_businesses_city` on `(city)`
- `idx_businesses_slug` on `(slug)` unique
- `idx_businesses_public_listing` on `(is_active, approval_status, deleted)`

Public business listings must require approval before display.

---

## 8) community_initiatives

Purpose: community-led projects, outreach, and collaborations.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK | |
| club_information_id | BIGINT | FK -> club_information(id), NOT NULL | |
| title | VARCHAR(200) | NOT NULL | |
| description | TEXT | NOT NULL | |
| start_date | DATE | NULL | |
| end_date | DATE | NULL | |
| location | VARCHAR(255) | NULL | |
| contact_email | VARCHAR(150) | NULL | |
| status | VARCHAR(20) | NOT NULL default 'planned' | planned, active, completed |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |
| deleted | BOOLEAN | NOT NULL default false | |
| deleted_at | TIMESTAMPTZ | NULL | |

Indexes:
- `idx_initiatives_club_information_id` on `(club_information_id)`
- `idx_initiatives_status` on `(status)`
- `idx_initiatives_deleted` on `(deleted)`

---

## 9) sponsors

Purpose: organization and business supporters.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK | |
| club_information_id | BIGINT | FK -> club_information(id), NOT NULL | |
| name | VARCHAR(150) | NOT NULL | |
| slug | VARCHAR(150) | NOT NULL, UNIQUE | |
| logo_url | VARCHAR(255) | NULL | |
| website | VARCHAR(255) | NULL | |
| sponsor_tier | VARCHAR(30) | NOT NULL | platinum, gold, silver, community |
| description | TEXT | NULL | |
| is_featured | BOOLEAN | NOT NULL default false | |
| is_active | BOOLEAN | NOT NULL default true | |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |
| deleted | BOOLEAN | NOT NULL default false | |
| deleted_at | TIMESTAMPTZ | NULL | |

Indexes:
- `idx_sponsors_club_information_id` on `(club_information_id)`
- `idx_sponsors_active` on `(is_active, deleted)`
- `idx_sponsors_slug` on `(slug)` unique

---

## 10) gallery_images

Purpose: media library for club events, culture, and community moments.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK | |
| club_information_id | BIGINT | FK -> club_information(id), NOT NULL | |
| title | VARCHAR(200) | NULL | |
| caption | TEXT | NULL | |
| image_url | VARCHAR(255) | NOT NULL | |
| alt_text | VARCHAR(255) | NULL | |
| category | VARCHAR(50) | NULL | event, festival, community |
| is_public | BOOLEAN | NOT NULL default true | |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |
| deleted | BOOLEAN | NOT NULL default false | |
| deleted_at | TIMESTAMPTZ | NULL | |

Indexes:
- `idx_gallery_images_club_information_id` on `(club_information_id)`
- `idx_gallery_images_public` on `(is_public, deleted)`

---

## 11) contact_messages

Purpose: inbound contact forms and general inquiries.

| Column | Type | Constraints | Notes |
| --- | --- | --- | --- |
| id | BIGSERIAL | PK | |
| club_information_id | BIGINT | FK -> club_information(id), NOT NULL | |
| name | VARCHAR(150) | NOT NULL | |
| email | VARCHAR(150) | NOT NULL | Contact email |
| phone | VARCHAR(50) | NULL | Optional |
| subject | VARCHAR(200) | NULL | |
| message | TEXT | NOT NULL | |
| status | VARCHAR(20) | NOT NULL default 'new' | new, read, replied |
| created_at | TIMESTAMPTZ | NOT NULL, default now() | |
| updated_at | TIMESTAMPTZ | NOT NULL, default now() | |
| deleted | BOOLEAN | NOT NULL default false | |
| deleted_at | TIMESTAMPTZ | NULL | |

Indexes:
- `idx_contact_messages_club_information_id` on `(club_information_id)`
- `idx_contact_messages_status` on `(status)`
- `idx_contact_messages_created_at` on `(created_at)`

---

## Relationship summary

- `club_information` is the central record.
- `events`, `announcements`, `community_initiatives`, `gallery_images`, `sponsors`, and `contact_messages` belong to the club.
- `businesses` belong to a `business_category` and a club.
- `volunteer_registrations` may optionally reference a `member` record.
- `members` keep personal contact fields private and minimal.

## Soft delete strategy

Use `deleted` and `deleted_at` instead of hard delete for:
- members
- businesses
- announcements
- events
- sponsors
- gallery images
- contact messages
- community initiatives

This preserves operational history while allowing the application to hide deleted records by default from public APIs.

## PostgreSQL notes

- Prefer `BIGSERIAL` for IDs to support future scale.
- Use `TIMESTAMPTZ` for all timestamps.
- Consider `CREATE INDEX` for `status`, `approval_status`, and slugs used in filtering and lookups.
- Use application-level validation alongside the database schema to enforce values like `pending`, `active`, `inactive`.
