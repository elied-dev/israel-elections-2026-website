# Domain glossary

## Election Guide
The part of the product used to compare all officially registered electoral lists, their candidates, and their policy positions for a specific election.

## Election Edition
A dated Election Guide for one election. It becomes concluded after authoritative final results are reviewed, but it is not frozen or copied into a separate archive. Effective-dated facts and append-only corrections preserve what was previously published. The first edition covers the 2026 Knesset election; support for later elections is a separate decision.

## Public Record
The part of the product used to find reviewed public sources associated with political actors and their past conduct.

## Political Actor
The shared category for a Person, Political Party, or Electoral List represented by the product. Political Actors can have profiles, Public Claims, and linked Source Records. Each retains dated names and aliases while presenting one current display name. Duplicate profiles can be merged into a surviving Political Actor without losing links or audit history. The Public Record covers conduct relevant to an actor's public or electoral role, not unrelated private conduct.

## Person
A human Political Actor whose identity remains stable across changes in name, party affiliation, candidacy, or public office.

## Political Party
A continuing organization that is a Political Actor. It is distinct from an Electoral List, which is specific to an election and can represent multiple parties. Party mergers and splits use explicit predecessor and successor relationships rather than automatic identity reuse.

## Electoral List
An officially registered, election-specific Political Actor contesting one Election Edition. It can represent one or more Political Parties. A later list is a new Electoral List even when it reuses a name; continuity is represented by an explicit predecessor relationship.

## Candidate
A Person appearing on an Electoral List through a Candidacy.

## Party Affiliation
A dated relationship between a Person and a Political Party.

## Office Tenure
A dated record of a Person holding a public office.

## Candidacy
A dated record of a Person's participation in one Electoral List for one Election Edition, including their list position and status. Withdrawal, disqualification, replacement, or position changes remain as dated status history rather than rewriting the original Candidacy.

## Current Political Status
The prominent, Reviewer-approved current summary on a Person's Political Actor profile, derived from all active Party Affiliations, Office Tenures, and Candidacies. It permits legitimate overlaps and uncertain dates rather than forcing one current position. It is derived from Source Records, shows when it was last verified, and does not change automatically from an external source. Earlier statuses remain visible in a dated history.

## Public Claim
A dated, attributed or documented statement supported by one or more Evidence Citations. An approved Source Proposal can produce zero or more Public Claims, and Reviewers can add them later. A Public Claim separately identifies the Political Actors who made the statement and those it concerns; either role can contain multiple actors. Its stated or observed date or date range is separate from source publication and review dates, and can be partial or unknown. Earlier and conflicting Public Claims remain visible. Published edits preserve a dated revision history showing what changed, who approved it, and why. Reviewers can explicitly mark one claim as superseding, clarifying, or contradicting another; the product does not infer these relationships automatically. Multiple Source Records can support one Public Claim without requiring a separate event entity. Policy Position is the only specialized claim type initially; other topics use Reviewer-managed Tags until distinct rules justify another type. Inclusion does not mean that the product endorses the claim.

## Evidence Citation
The reviewed link between a Public Claim and a specific Source Version. Every Public Claim requires at least one. It identifies an exact supporting Quotation, page, timestamp, section, or other location when the source permits it; otherwise it records the most precise available locator and a Reviewer explanation.

## Quotation
An exact excerpt preserved in its Source Language and associated with an Evidence Citation. Contributors can submit Translation Proposals for Quotations, subject to review and reuse rights. A translated Quotation is shown alongside, never instead of, the original and is clearly labelled when unofficial or machine-assisted.

## Policy Position
A Public Claim that neutrally summarizes a Political Actor's stated position, supported by quotations and links to original material.

## Contributor
An authenticated person who can submit a Source Proposal or Translation Proposal but cannot publish either.

## Source Proposal
A Contributor's preserved submission of an article, book, or online source, including its proposed links to Political Actors, descriptive tags, and suggested relevance summary. Every Source Record originates from a Source Proposal, including sources found by Reviewers, so all published sources have the same traceable intake history. Review does not turn a proposal into a Source Record or replace its submitted content. Multiple Contributors can submit the same external source; each Source Proposal retains its own review history while approved duplicates point to one shared Source Record. Its review status and history remain visible even when it is rejected, subject to safety and privacy rules.

## Reviewer
An authorized person with explicitly granted subject, language, and decision scopes who reviews Source Proposals, Translation Proposals, and published Informational Content. A Reviewer cannot solely approve their own contribution, appeal, or emergency action.

## Administrator
An authorized person who manages accounts, permissions, configuration, security restrictions, and operational recovery. Administrative authority does not include editorial authority unless the person separately holds the required Reviewer scope.

## Conflict of Interest
A personal, family, employment, financial, political-campaign, party, litigation, advocacy, or close organizational relationship that a reasonable reader could see as affecting impartiality. It requires disclosure and recusal from the affected Review Decision.

## Review Decision
A Reviewer's dated acceptance or rejection of a Source Proposal, or resolution of an appeal, correction, redaction, removal, or emergency restriction. It preserves the responsible Reviewer's public identity, policy basis, and public reason when safe. A later Review Decision does not overwrite an earlier one.

## Public Review History
The visible record of a concluded Source Proposal review, including safe submitted revisions, status changes, Review Decisions, appeals, corrections, redactions, removals, and resulting Source Records. Drafts and pending reviews remain private. Harmful, illegal, dangerous, or private material remains restricted while a safe public entry preserves the fact, date, policy category, and reason for moderation.

## Source Record
A Reviewer-controlled publication created from an approved Source Proposal and linked back to it. Approval can publish a Source Record without creating a Public Claim. It retains factual provenance such as publisher, author, dates, source type, and corrections, but no reliability or truth score. If the external source becomes unavailable, the Source Record and supported Public Claims remain visible with an availability warning and only material the product may legally retain. Corrections preserve a dated revision history showing what changed, who approved it, and why; later review policy determines public visibility and exceptional redactions. Corrections or redactions do not overwrite the preserved Source Proposal.

## Source Version
The form of an external source reviewed at a specific retrieval date. It records the URL, observed publication or update date, and a legally permitted snapshot or checksum. Duplicate identity follows the underlying publication and version rather than URL alone. Mirrors can identify the same Source Version; materially changed editions, updates, translations, or corrections remain distinct and explicitly linked. A Reviewer makes the final duplicate decision.

## Tag
A term from a Reviewer-managed vocabulary used to classify Public Claims and Source Records. Contributors can suggest tags, but only Reviewers approve canonical tags. Political Actors are not tagged unless a concrete browsing need is established.

## Informational Content
Site-authored material such as interface text, actor profiles, Public Claims, Policy Position summaries, relevance summaries, tags, and Review Decisions. Each revision has one Reference Language and independently reviewed Language Versions with their own Translation Status. At least one Language Version must be reviewed before publication; translation completeness does not block publication.

## Reference Language
The language used as the authoritative semantic reference for one revision of Informational Content. It can be Hebrew or English. Language-review disputes are resolved against that revision rather than treating either language as globally authoritative.

## Source Language
The language in which an external source was originally published. The original source remains available regardless of whether translated editions exist. A translated external publication is a separate source or edition, not a Language Version of Informational Content.

## Translation Proposal
A Contributor's preserved proposed language version of a specific revision of a Public Claim, other Informational Content, or Quotation. Any language can be proposed. Review does not replace the submitted wording. Multiple proposals can target the same item and language; one Reviewer-approved canonical version is published while all proposals and attribution to the Contributor and approving Reviewer remain in review history. Public attribution follows the applicable identity and privacy rules.

## Language Version
A rendering of a specific revision of Informational Content or a Quotation in one language. It records its actual language, text direction, Contributor and Reviewer attribution, and any machine assistance. If the reference revision changes materially, other Language Versions return to pending until reviewed against it; minor corrections can be confirmed without rewriting. Earlier versions remain in revision history rather than being overwritten.

## Translation Status
The visible state of each Language Version: reviewed, pending, or unavailable. A proposed translation is not published before review. Translation availability is determined per item, so any reviewed interface or content element can display in the selected language while unavailable elements follow the visitor's Language Preference fallback order.

## Language Preference
A visitor's ordered list of preferred languages used independently for each interface and Informational Content item. The first available reviewed version is displayed, and each rendered element identifies its actual language and text direction. Visitors without a saved preference use their browser language preferences followed by English; English is the global final fallback.
