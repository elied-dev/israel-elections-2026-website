# Policy Position comparison

**Issue:** [#23 — Compare Electoral Lists by Policy Position](https://github.com/elied-dev/israel-elections-2026-website/issues/23)

## Decisions

- `/policy-positions` is a dynamic Server Component and compares the first supported Election Edition, matching the existing Election Directory scope.
- A `policy_positions` row classifies one Public Claim with one non-empty policy topic. The claim's Electoral List speakers determine the compared list; the comparison does not infer positions from Parties, Candidates, or subjects.
- Each topic renders every approved Electoral List in neutral alphabetical order. A list without a reviewed, publicly supportable Policy Position displays an unavailable state.
- Evidence remains in the comparison through native HTML `<details>`: approved quotation, source/version provenance, review state, and reviewed translation or an unavailable translation state. Pending records never render.
- The page uses server-rendered semantic tables. No client data fetch or mobile-only content variant is added.

Production migration is deferred; the generated migration is exercised only against the local test database.
