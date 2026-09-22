# Source Record Pages Design

**Issue:** [#21 — Publish permanent Source Record pages](https://github.com/elied-dev/israel-elections-2026-website/issues/21)

## Decisions

- `/sources/<id>` uses the permanent numeric `Source Record` ID. Invalid, out-of-range, unknown, and unapproved IDs return 404; Source Records do not use mutable slugs.
- `source_records` owns publication-level metadata and availability. Nullable metadata renders as “Not known”; no reliability, truth, or publisher score exists.
- `source_versions` stores each materially changed edition, update, translation, or correction as a distinct reviewed row. An optional predecessor and change summary make the relationship explicit.
- `source_version_locations` lets one reviewed version have one original URL and any number of mirror URLs. A URL is a location, not version identity.
- `source_reuse` is the only place this slice stores copied material. Every row requires a reuse basis and required attribution; retained text is optional. The schema deliberately has no general source-body or public snapshot field.
- Unavailable records remain routable with a prominent warning. Their public page can show metadata, links, checksums, and approved `source_reuse` material only.
- Corrections are Source Versions with change type `correction`; the page lists them both in version history and a dedicated Corrections section.
- Every public query filters Source Records, Source Versions, locations, and reuse rows to `review_state = 'approved'`.

Source Proposal intake/review, claims and citations, attachments/Blob storage, correction mutation workflows, and production data migration belong to later issues and are not added here.

## Test seams

The delegated seam decision is:

1. PostgreSQL through Drizzle for normalized relationships and constraints.
2. The rendered `/sources/<id>` Server Component for publication, privacy filtering, warnings, permanent-route behavior, version/mirror display, reuse attribution, and absence of scoring.
3. The generated migration file for additive migration shape.

Tests use a disposable local PostgreSQL database. No production migration is run.
