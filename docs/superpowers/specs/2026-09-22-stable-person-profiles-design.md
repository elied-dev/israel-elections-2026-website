# Stable Person Profiles Design

**Issue:** [#20 — Publish stable Person profiles](https://github.com/elied-dev/israel-elections-2026-website/issues/20)

## Goal

Publish one stable Person profile that preserves dated names, aliases, Party Affiliations, Office Tenures, Candidacies, and Reviewer-approved Current Political Status across change. The profile must show legitimate current overlaps, last verification, and earlier status history without inferring unreviewed facts.

## Scope

This work extends the minimal Person identity route introduced in #19. It adds only the normalized history and public read model needed by #20. It does not add Party profile routes, editorial create/update screens, automatic status derivation, translations, Public Claims, or Public Record integration.

## Date precision

Every uncertain date is stored as a nullable date plus a required precision:

- `day`: display `2026-09-22`
- `month`: display `September 2026`
- `year`: display `2026`
- `unknown`: display `Date unknown`

A missing date uses `unknown` precision. A row with `day`, `month`, or `year` precision requires a date. The application formats public dates by precision and never invents missing day or month values.

## Domain model

### Stable Person identity and names

Existing `persons.id` remains the stable Person identity and is the ID used by `/people/<id>`. `political_actors.current_display_name` remains the currently displayed name.

`person_names` preserves the append-only name and alias history:

- Person ID
- name text
- name type: `name` or `alias`
- effective-from date and precision
- optional effective-to date and precision
- authoritative source ID
- review state

The profile displays the current Political Actor name first, then approved `person_names` under **Names and aliases**. Former names and aliases do not replace the stable Person identity.

### Party Affiliation and Office Tenure

`party_affiliations` records an effective-dated relationship between one Person and one Political Party. `office_tenures` records an effective-dated relationship between one Person and an office title. Each row stores source and review state, plus independent start and end date precision.

Overlaps are valid and expected. The system does not force a Person into one party, office, or candidacy. Approved records remain visible in history even after they conclude.

### Current Political Status and history

`political_statuses` stores a Reviewer-approved status snapshot for one Person:

- Person ID
- summary text
- verification date
- authoritative source ID
- review state
- optional `superseded_at`

`political_status_items` stores the snapshot's overlapping records. Each item records an authoritative source and review state, and references exactly one existing Party Affiliation, Office Tenure, or Candidacy. A database check ensures exactly one of those references is present. A unique constraint prevents the same source record appearing twice in one snapshot.

The Current Political Status is the approved snapshot without `superseded_at`. It displays the snapshot summary, every approved linked item, and `verified_at`. An approved snapshot does not automatically update when an underlying relationship changes. Earlier approved snapshots, including their items, remain visible under **Earlier Political Statuses** in reverse verification order. Pending snapshots and items never render.

## Person profile

`/people/<id>` remains a dynamic server-rendered route.

- Nonnumeric, out-of-range, unknown, and nonpublic Person IDs return 404.
- A Person becomes publicly routable only when they have at least one approved Candidacy revision on an approved Electoral List.
- The profile shows:
  1. current display name;
  2. Current Political Status and last verification date, or a neutral unavailable message;
  3. current snapshot's approved overlapping Party Affiliations, Office Tenures, and Candidacies;
  4. Names and aliases;
  5. Party Affiliation history;
  6. Office Tenure history;
  7. Candidacy history; and
  8. earlier approved Political Statuses.
- Empty approved categories display neutral unavailable states. The application does not infer missing data.

Use semantic headings and lists. All information stays in server-rendered document flow; narrow screens wrap content without hiding data or requiring client-side behavior.

## Publication and provenance

Every public name, alias, Party Affiliation, Office Tenure, status snapshot, and status item has an authoritative source and review state. The public query filters to `review_state = 'approved'` at every boundary. Existing Candidacy publication rules remain unchanged.

## Database invariants

- Person name type must be `name` or `alias`.
- Date precision must be `day`, `month`, `year`, or `unknown`.
- Known date precision requires a date.
- End dates, where known, must not precede start dates.
- Political Status item rows reference exactly one of Party Affiliation, Office Tenure, or Candidacy.
- One snapshot cannot include the same linked record twice.
- One Person has at most one approved current status snapshot.
- Foreign keys preserve the links between snapshots, items, and their underlying records.

## Testing

Test the public `/people/<id>` Server Component against a real disposable PostgreSQL database after the complete migration chain applies.

Seed one public Person with:

- current, former, and alias names using day, month, year, and unknown precision;
- overlapping approved Party Affiliations, Office Tenures, and Candidacies;
- pending records that must stay private;
- an approved current status snapshot with verification date and all three item types;
- an earlier approved snapshot;
- a pending snapshot and item that must not render.

Assert:

- the stable Person ID resolves to one profile across every record type;
- date labels match their precision without invented detail;
- current overlaps, current status, and last verification are visible;
- earlier status remains visible;
- pending names, relationships, snapshot, and item stay private;
- neutral empty states render for a public Person without reviewed optional categories;
- invalid and nonpublic Person references 404;
- markup is semantic and server-rendered;
- migration constraints reject invalid precision, duplicate current approved statuses, and invalid multi-reference status items.

Run focused tests, the complete suite, TypeScript, production build, local smoke, and production verification.

## Explicit non-goals

- Party profile pages or Party history
- Person-profile editing, Reviewer workflows, or status automation
- Automatic Current Political Status recalculation
- Translation or Language Preference behavior
- Public Claims, Policy Positions, Source Records, or evidence pages
- Client-side data fetching, client-only responsive UI, or a styling system
