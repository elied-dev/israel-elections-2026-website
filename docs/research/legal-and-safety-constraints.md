# Legal and safety constraints

Researched 2026-09-16. This is product-risk research, not legal advice. Qualified Israeli counsel must review the marked launch questions.

## Decision-ready findings

### Keep the product informational, not election advocacy

The State Comptroller's 2026 notice on [registration and reporting duties for an “active body in elections”](https://www.mevaker.gov.il/newsroom/2026-04-19-elections) quotes the Political Parties Financing Law definition. It includes creating a voter-identification database paired with voting intentions for campaign activity, targeted approaches intended to influence voters for or against a list, and advertising intended to influence that choice. The notice sets a 2026 value threshold of NIS 120,400 for registration/reporting and warns of criminal and financial consequences.

Product boundary:

- Do not collect voting intentions.
- Do not target content or messages using political views.
- Do not solicit votes, endorse lists, or optimize presentation to persuade.
- Label and review any paid or sponsored material; preferably exclude it in the first release.
- Obtain election-law advice before any campaigning, voter outreach, political advertising, fundraising, or personalization based on political data.

### Contributor accounts create privacy and security duties

The Israeli Privacy Protection Authority is the relevant regulator and publishes [privacy legislation and official translations](https://www.gov.il/en/pages/legislation), including a page for the [2025 Privacy Protection Law amendment](https://www.gov.il/en/pages/privacy-protection-law-amendment-2025), guidance on the [Privacy Protection Law](https://www.gov.il/en/pages/legislation_privacy_protection_law), and the [Privacy Protection Regulations (Data Security)](https://www.gov.il/en/pages/data_security_regulation).

Minimum product requirements:

- Collect only the identity and contact data needed for authentication, accountability, and abuse response.
- Publish a plain-language privacy notice covering purpose, recipients, retention, access/correction channels, and public attribution.
- Separate public display names from private account and security data.
- Define access control, credential protection, logging, backup, incident handling, vendor access, and deletion/retention before launch.
- Perform a counsel-led assessment under the amended law of registration, notification, data-protection-officer, cross-border processing, and security-level obligations for the actual deployment and vendors.

### Public review history needs a safety exception

Making rejected proposals public can itself republish personal data, threats, illegal material, or defamatory allegations. Preserve a public event showing that a submission was received and moderated, but support restricted evidence and a public redacted reason. Do not make raw rejected content immutable or permanently public.

### Attribution is not a complete defamation safeguard

Statements about past conduct can create exposure even when linked to another publisher. The editorial policy must distinguish established facts, attributed allegations, opinions, corrections, and retractions; retain source and publication dates; offer a correction/right-of-reply channel; and escalate high-risk claims for legal review. Counsel should approve the detailed defamation standard before launch because accessible official English primary material was insufficient for a reliable self-service interpretation.

### Accessibility is a launch requirement

The Commission for Equal Rights of Persons with Disabilities explains that an accessible website under the Service Accessibility Regulations is one made accessible under [Israeli Standard 5568](https://www.gov.il/en/pages/website_accessibility). The specification should require semantic structure, keyboard operation, visible focus, text alternatives, contrast, form errors, captions where applicable, zoom/reflow, and tested Hebrew right-to-left behavior. Counsel or an accessibility specialist should confirm applicability, exemptions, required accessibility statements, and the exact current standard version.

## Required launch controls

- Published editorial policy and corrections/right-of-reply process.
- Moderation escalation for privacy, threats, hate, illegality, and potentially defamatory content.
- Redaction that preserves an audit event without exposing prohibited material.
- Privacy notice, retention schedule, role-based access, security logging, incident procedure, and vendor inventory.
- Accessibility acceptance testing in Hebrew, English, and French interface states.
- Clear non-affiliation and methodology disclosures; no implication that the CEC endorses the product.

## Counsel checkpoints

Before public launch, Israeli counsel should determine:

1. whether the site's content, funding, promotion, or analytics could make it election propaganda or activity by an active election body;
2. required sponsor/publisher disclosures during the election period;
3. the exact privacy duties after Amendment 13 for the chosen data, scale, hosting region, and processors;
4. the publication/redaction standard for allegations and rejected proposals;
5. applicable accessibility obligations and remedies; and
6. terms, governing law, takedown, and preservation procedures.
