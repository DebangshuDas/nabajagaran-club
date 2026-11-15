---
name: production-feature-implementation
description: Use when implementing or extending a feature in an existing production application, especially when database, API, frontend, security, or migration changes are involved.
---

# Production Feature Implementation

Extend the existing application safely and narrowly. Treat the current repository and database as authoritative; do not assume architecture, schema, endpoints, or conventions from a request alone.

## Before implementation

1. Inspect the repository, database schema and migrations, related entities, repositories, services, controllers, DTOs, frontend components, routes, and security configuration.
2. Search for existing behavior and helpers to reuse before adding new ones.
3. Before editing files, present an implementation plan that identifies:
   - Existing files and components to reuse.
   - New files required.
   - Database changes, if any.
   - API endpoints to add or reuse.
   - Frontend routes and components to add or change.
   - Security considerations.
4. Do not start implementation until the plan has been presented. If a material design decision remains unresolved, ask the user before proceeding.

## Implementation rules

- Reuse existing entities, repositories, services, components, and business logic. Do not create duplicates.
- Keep changes limited to the requested feature and its necessary call sites. Do not modify unrelated modules.
- Never edit a previously applied database migration. Add a new versioned migration only when the inspected schema demonstrates that one is necessary.
- Preserve existing production data. Avoid destructive schema changes, unnecessary data updates, and invented production content.
- Protect every administrative write operation with backend authorization; hiding a route in the frontend is not security.
- Keep public APIs read-only and publication-aware. Do not expose unpublished or otherwise private content.
- Do not hardcode production content in React components. Retrieve managed content through the existing API architecture.
- Preserve the existing public website design, navigation, and behavior unless the request explicitly requires a change.
- Use typed request and response DTOs, validate inputs at the appropriate layers, and return meaningful errors without exposing internal exception details.
- Follow existing project naming, formatting, localization, and error-handling conventions.

## Verification

- Add focused tests for the behavior introduced or fixed.
- Test backend behavior and frontend behavior independently.
- Run the relevant backend tests, frontend lint/tests, and production builds before reporting completion.
- Fix regressions introduced by the change; do not expand work into unrelated pre-existing issues.

## Completion report

Summarize:

- Features implemented and files changed.
- Database changes or confirmation that none were needed.
- API endpoints and frontend routes added or reused.
- Security behavior.
- Tests and builds run, including their results.
- Any remaining limitations or manual verification steps.
