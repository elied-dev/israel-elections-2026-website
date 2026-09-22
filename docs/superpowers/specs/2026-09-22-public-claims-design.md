# Public Claims Design

**Issue:** [#22 — Publish Public Claims with inspectable evidence](https://github.com/elied-dev/israel-elections-2026-website/issues/22)

## Decisions

- `/claims/<id>` uses the permanent numeric `Public Claim` ID. Invalid, out-of-range, unknown, unapproved, and uncited claims return 404.
- `public_claims` stores the reviewed claim summary, its stated or observed date/range with explicit precision, and its separate review date. Source publication/update and retrieval dates remain on `source_records` and `source_versions`.
- `public_claim_speakers` and `public_claim_subjects` are separate many-to-many Political Actor relationships. A Political Actor can occupy both roles when the reviewed record requires it.
- `evidence_citations` links a claim to the exact reviewed Source Version and always stores a non-empty locator. A `best_available` locator also requires a Reviewer explanation.
- Publication is enforced at the public read boundary: an approved claim is not public unless it has at least one approved Evidence Citation to an approved Source Version and Source Record. This avoids pretending a parent-row check can enforce the existence of a child row.
- `quotations` preserve approved exact excerpts in their Source Language. `quotation_translations` are separate rows; only approved translations render, beside rather than instead of the original, with language, text direction, and machine-assistance status.
- Citation links target the existing permanent Source Record page and the cited Source Version anchor. All new public reads exclude pending records.

Editorial mutation workflows, claim revision history, claim-to-claim relationships, general Informational Content translation, Party profile routes, and production data migration remain out of scope.
