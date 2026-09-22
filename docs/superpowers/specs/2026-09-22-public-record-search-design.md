# Public Record Search Design

**Issue:** [#24 — Search and browse the Public Record](https://github.com/elied-dev/israel-elections-2026-website/issues/24)

## Decisions

- `/public-record` is a dynamic Server Component with a GET form. With no query it browses approved results in neutral type/title/ID order; with a query it orders by text relevance and uses the same neutral tie-breakers.
- Results cover public Political Actors, cited approved Public Claims, approved Tags, and approved Source Records. Searchable text includes current actor names, approved Person name/alias history, reviewed actor search terms, claim summaries and evidence text, Tag names, and source title/type/author/publisher metadata.
- `political_actor_search_terms` stores reviewed aliases, historical names, transliterations, and spelling variants that are needed for discovery but must not replace the current display name. Existing `person_names` remains the dated Person-profile history.
- `tags`, `public_claim_tags`, and `source_record_tags` provide the smallest Reviewer-managed Tag vocabulary and approved publication links required for search and filtering.
- `public_claims.language` records the claim-summary language. `source_records.source_language` records the external source language. Existing rows are migrated to `und` rather than assigning an invented language.
- PostgreSQL performs matching. Trigram similarity handles Hebrew variants and transliteration misspellings; language-selected full-text search uses `english`, `french`, or `simple` configuration. Ranking contains only exact/prefix/text-search/similarity signals and has no prominence field or input.
- Political Actor type filters actors and records linked through claim speaker/subject roles. Tag filters claims and sources. Date filters claim statement ranges and source publication dates. Language filters actor terms, claim summaries, Tags, and source metadata; content with `und` does not satisfy a named language filter.
- Invalid dates are ignored, query text is trimmed to 200 characters, and every search relation is filtered to reviewed public data. No client-side search, external search service, automatic transliteration, editorial UI, or production migration is included.
