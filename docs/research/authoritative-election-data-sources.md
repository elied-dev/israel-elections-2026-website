# Authoritative election data sources

Researched 2026-09-16. This note separates official ballot facts from political actors' own claims and from editorial summaries.

## Decision-ready findings

1. **Use the Central Elections Committee (CEC) as the authority for ballot facts.** Its official [Lists of Candidates guide](https://www.gov.il/en/pages/candidates-lists-26) is the 26th-Knesset entry point and states that it will contain information about the candidate lists running in the election. Treat list name, ballot letters, candidacy order, registration, approval, disqualification, withdrawal, and final status as CEC-controlled facts.
2. **Use the official election hub for dates and notices.** The CEC's [Elections for the 26th Knesset page](https://www.gov.il/en/pages/knesset-elections-2026) is the primary event-level source. Capture the retrieval time because notices can change during the election process.
3. **Use each party or list's own dated publication for its stated platform.** The CEC source establishes ballot participation; it does not establish a complete, normalized policy platform. Label a party document as a first-party statement, preserve its publication date and URL, and never infer a missing position.
4. **Do not depend on an undocumented 2026 API.** The government open-data platform supports CKAN-style JSON resources—for example, its documented `datastore_search` pattern is visible in [this official API response](https://data.gov.il/api/3/action/datastore_search?limit=1&resource_id=5c78e9fa-c2e2-4771-93ff-7f400a12f7ba)—but this research did not locate a documented candidate-list API or a guaranteed update feed for the 26th Knesset.
5. **Create product-owned stable identifiers.** Ballot letters, list names, alliances, and candidate order can change and are election-specific. Store CEC labels as sourced attributes, not as permanent identities for a person or party.
6. **Snapshot provenance, not third-party page contents by default.** For every imported fact record source URL, retrieval time, election edition, source-language label, and a content checksum where lawful. A human reviewer should approve changes until an official structured feed and its terms are confirmed.

## Source matrix

| Information | Primary authority | Expected access | Update model | Identity caveat |
|---|---|---|---|---|
| Registered lists and ballot labels | CEC candidate-list guide | Dynamic web guide | Event-driven during registration and challenges | Election-specific label, not a permanent party ID |
| Candidate names and order | CEC candidate-list guide | Dynamic web guide/list pages | May change until the official process is final | Name is not a safe unique key |
| Election date and official notices | CEC election hub | Dynamic web pages/notices | Event-driven | Record publication and retrieval dates |
| Party/list platform | The political actor's official dated publication | HTML or document, format varies | No common cadence | First-party claim, not neutral fact |
| Historical results | CEC election pages; government open-data resources where separately published | Web pages and sometimes downloadable/JSON resources | Per election/publication | Dataset-specific identifiers and terms |
| Candidate photographs | No reusable source established by this ticket | Usually page images | Unknown | Do not copy without a recorded license |

## Import policy implied by the evidence

- Before the CEC publishes an official item, show **not yet officially available**, not a predicted value.
- Keep the original Hebrew spelling and source text; translations are separate reviewed content.
- Diff newly retrieved official data against the last reviewed snapshot and require approval before replacing public values.
- Retain superseded values with effective dates so the archived Election Edition is explainable.
- Never treat polls, news reports, Wikipedia, or party announcements as authoritative for official ballot status.

## Open uncertainties

- No documented machine-readable 26th-Knesset candidate feed, stable person identifier, API service level, or update cadence was found.
- The CEC page's explicit reuse terms and the rights to candidate photographs remain unresolved; see **Establish reuse rights for sources and images**.
- The final specification must confirm the exact CEC publication sequence and operational timetable shortly before import work begins, because official pages are updated during the election process.
