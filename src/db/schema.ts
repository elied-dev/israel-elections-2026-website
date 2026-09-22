import { sql } from 'drizzle-orm';
import {
  boolean,
  check,
  foreignKey,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uniqueIndex,
} from 'drizzle-orm/pg-core';

export const applicationReadiness = pgTable('application_readiness', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const electionEditions = pgTable('election_editions', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  status: text('status').notNull(),
});

export const authoritativeSources = pgTable('authoritative_sources', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
  url: text('url').notNull(),
  retrievedAt: timestamp('retrieved_at', { withTimezone: true }).notNull(),
});

export const politicalActors = pgTable('political_actors', {
  id: integer('id').primaryKey(),
  type: text('type').notNull(),
  currentDisplayName: text('current_display_name').notNull(),
  currentSlug: text('current_slug').notNull().unique(),
}, (table) => [
  check('political_actor_type_check', sql`${table.type} in ('person', 'political_party', 'electoral_list')`),
  check('political_actor_slug_not_numeric_check', sql`${table.currentSlug} !~ '^[0-9]+$'`),
]);

export const politicalActorSlugs = pgTable('political_actor_slugs', {
  slug: text('slug').primaryKey(),
  actorId: integer('actor_id').notNull().references(() => politicalActors.id),
  validFrom: timestamp('valid_from', { withTimezone: true }).notNull(),
  validTo: timestamp('valid_to', { withTimezone: true }),
}, (table) => [
  check('political_actor_slug_dates_check', sql`${table.validTo} is null or ${table.validTo} > ${table.validFrom}`),
]);

export const persons = pgTable('persons', {
  id: integer('id').primaryKey().references(() => politicalActors.id),
});

export const politicalParties = pgTable('political_parties', {
  id: integer('id').primaryKey().references(() => politicalActors.id),
});

export const electoralLists = pgTable('electoral_lists', {
  id: integer('id').primaryKey().references(() => politicalActors.id),
  editionId: integer('edition_id').notNull().references(() => electionEditions.id),
  name: text('name').notNull(),
  ballotIdentifier: text('ballot_identifier'),
  sourceId: integer('source_id').references(() => authoritativeSources.id),
  reviewState: text('review_state').notNull(),
}, (table) => [
  unique('electoral_lists_id_edition_id_unique').on(table.id, table.editionId),
]);

export const electoralListParties = pgTable('electoral_list_parties', {
  electoralListId: integer('electoral_list_id').notNull().references(() => electoralLists.id),
  politicalPartyId: integer('political_party_id').notNull().references(() => politicalParties.id),
  sourceId: integer('source_id').notNull().references(() => authoritativeSources.id),
  reviewState: text('review_state').notNull(),
}, (table) => [
  primaryKey({ columns: [table.electoralListId, table.politicalPartyId] }),
]);

export const candidacies = pgTable('candidacies', {
  id: integer('id').primaryKey(),
  personId: integer('person_id').notNull().references(() => persons.id),
  electoralListId: integer('electoral_list_id').notNull(),
  editionId: integer('edition_id').notNull(),
}, (table) => [
  unique('candidacy_person_electoral_list_unique').on(table.personId, table.electoralListId),
  unique('candidacy_id_electoral_list_unique').on(table.id, table.electoralListId),
  foreignKey({
    columns: [table.electoralListId, table.editionId],
    foreignColumns: [electoralLists.id, electoralLists.editionId],
    name: 'candidacy_electoral_list_edition_fk',
  }),
]);

export const personNames = pgTable('person_names', {
  id: integer('id').primaryKey(),
  personId: integer('person_id').notNull().references(() => persons.id),
  name: text('name').notNull(),
  nameType: text('name_type').notNull(),
  validFrom: timestamp('valid_from', { withTimezone: true }),
  validFromPrecision: text('valid_from_precision').notNull(),
  validTo: timestamp('valid_to', { withTimezone: true }),
  validToPrecision: text('valid_to_precision').notNull(),
  sourceId: integer('source_id').notNull().references(() => authoritativeSources.id),
  reviewState: text('review_state').notNull(),
}, (table) => [
  check('person_name_type_check', sql`${table.nameType} in ('name', 'alias')`),
  check('person_name_valid_from_precision_check', sql`(${table.validFromPrecision} = 'unknown') = (${table.validFrom} is null)`),
  check('person_name_valid_to_precision_check', sql`(${table.validToPrecision} = 'unknown') = (${table.validTo} is null)`),
  check('person_name_precision_check', sql`${table.validFromPrecision} in ('day', 'month', 'year', 'unknown') and ${table.validToPrecision} in ('day', 'month', 'year', 'unknown')`),
  check('person_name_dates_check', sql`${table.validTo} is null or ${table.validFrom} is null or ${table.validTo} >= ${table.validFrom}`),
]);

export const partyAffiliations = pgTable('party_affiliations', {
  id: integer('id').primaryKey(),
  personId: integer('person_id').notNull().references(() => persons.id),
  politicalPartyId: integer('political_party_id').notNull().references(() => politicalParties.id),
  validFrom: timestamp('valid_from', { withTimezone: true }),
  validFromPrecision: text('valid_from_precision').notNull(),
  validTo: timestamp('valid_to', { withTimezone: true }),
  validToPrecision: text('valid_to_precision').notNull(),
  sourceId: integer('source_id').notNull().references(() => authoritativeSources.id),
  reviewState: text('review_state').notNull(),
}, (table) => [
  check('party_affiliation_valid_from_precision_check', sql`(${table.validFromPrecision} = 'unknown') = (${table.validFrom} is null)`),
  check('party_affiliation_valid_to_precision_check', sql`(${table.validToPrecision} = 'unknown') = (${table.validTo} is null)`),
  check('party_affiliation_precision_check', sql`${table.validFromPrecision} in ('day', 'month', 'year', 'unknown') and ${table.validToPrecision} in ('day', 'month', 'year', 'unknown')`),
  check('party_affiliation_dates_check', sql`${table.validTo} is null or ${table.validFrom} is null or ${table.validTo} >= ${table.validFrom}`),
]);

export const officeTenures = pgTable('office_tenures', {
  id: integer('id').primaryKey(),
  personId: integer('person_id').notNull().references(() => persons.id),
  officeTitle: text('office_title').notNull(),
  validFrom: timestamp('valid_from', { withTimezone: true }),
  validFromPrecision: text('valid_from_precision').notNull(),
  validTo: timestamp('valid_to', { withTimezone: true }),
  validToPrecision: text('valid_to_precision').notNull(),
  sourceId: integer('source_id').notNull().references(() => authoritativeSources.id),
  reviewState: text('review_state').notNull(),
}, (table) => [
  check('office_tenure_valid_from_precision_check', sql`(${table.validFromPrecision} = 'unknown') = (${table.validFrom} is null)`),
  check('office_tenure_valid_to_precision_check', sql`(${table.validToPrecision} = 'unknown') = (${table.validTo} is null)`),
  check('office_tenure_precision_check', sql`${table.validFromPrecision} in ('day', 'month', 'year', 'unknown') and ${table.validToPrecision} in ('day', 'month', 'year', 'unknown')`),
  check('office_tenure_dates_check', sql`${table.validTo} is null or ${table.validFrom} is null or ${table.validTo} >= ${table.validFrom}`),
]);

export const candidacyRevisions = pgTable('candidacy_revisions', {
  id: integer('id').primaryKey(),
  candidacyId: integer('candidacy_id').notNull(),
  electoralListId: integer('electoral_list_id').notNull(),
  position: integer('position').notNull(),
  status: text('status').notNull(),
  effectiveFrom: timestamp('effective_from', { withTimezone: true }).notNull(),
  effectiveTo: timestamp('effective_to', { withTimezone: true }),
  sourceId: integer('source_id').notNull().references(() => authoritativeSources.id),
  reviewState: text('review_state').notNull(),
}, (table) => [
  foreignKey({
    columns: [table.candidacyId, table.electoralListId],
    foreignColumns: [candidacies.id, candidacies.electoralListId],
    name: 'candidacy_revision_candidacy_list_fk',
  }),
  uniqueIndex('candidacy_revision_open_unique')
    .on(table.candidacyId)
    .where(sql`${table.effectiveTo} is null`),
  uniqueIndex('candidacy_revision_current_position_unique')
    .on(table.electoralListId, table.position)
    .where(sql`${table.effectiveTo} is null and ${table.status} = 'active' and ${table.reviewState} = 'approved'`),
  check('candidacy_revision_position_check', sql`${table.position} > 0`),
  check('candidacy_revision_status_check', sql`${table.status} in ('active', 'withdrawn', 'disqualified', 'replaced')`),
  check('candidacy_revision_dates_check', sql`${table.effectiveTo} is null or ${table.effectiveTo} > ${table.effectiveFrom}`),
]);

export const politicalStatuses = pgTable('political_statuses', {
  id: integer('id').primaryKey(),
  personId: integer('person_id').notNull().references(() => persons.id),
  summary: text('summary').notNull(),
  verifiedAt: timestamp('verified_at', { withTimezone: true }).notNull(),
  sourceId: integer('source_id').notNull().references(() => authoritativeSources.id),
  reviewState: text('review_state').notNull(),
  supersededAt: timestamp('superseded_at', { withTimezone: true }),
}, (table) => [
  uniqueIndex('political_status_current_approved_unique')
    .on(table.personId)
    .where(sql`${table.reviewState} = 'approved' and ${table.supersededAt} is null`),
]);

export const politicalStatusItems = pgTable('political_status_items', {
  id: integer('id').primaryKey(),
  politicalStatusId: integer('political_status_id').notNull().references(() => politicalStatuses.id),
  partyAffiliationId: integer('party_affiliation_id').references(() => partyAffiliations.id),
  officeTenureId: integer('office_tenure_id').references(() => officeTenures.id),
  candidacyId: integer('candidacy_id').references(() => candidacies.id),
  sourceId: integer('source_id').notNull().references(() => authoritativeSources.id),
  reviewState: text('review_state').notNull(),
}, (table) => [
  check('political_status_item_one_reference_check', sql`((case when ${table.partyAffiliationId} is null then 0 else 1 end) + (case when ${table.officeTenureId} is null then 0 else 1 end) + (case when ${table.candidacyId} is null then 0 else 1 end)) = 1`),
  uniqueIndex('political_status_item_party_unique').on(table.politicalStatusId, table.partyAffiliationId).where(sql`${table.partyAffiliationId} is not null`),
  uniqueIndex('political_status_item_office_unique').on(table.politicalStatusId, table.officeTenureId).where(sql`${table.officeTenureId} is not null`),
  uniqueIndex('political_status_item_candidacy_unique').on(table.politicalStatusId, table.candidacyId).where(sql`${table.candidacyId} is not null`),
]);

export const sourceRecords = pgTable('source_records', {
  id: integer('id').primaryKey(),
  title: text('title').notNull(),
  sourceType: text('source_type').notNull(),
  author: text('author'),
  publisher: text('publisher'),
  publicationDate: timestamp('publication_date', { withTimezone: true }),
  availability: text('availability').notNull(),
  reviewState: text('review_state').notNull(),
}, (table) => [
  check('source_record_availability_check', sql`${table.availability} in ('available', 'unavailable')`),
]);

export const sourceVersions = pgTable('source_versions', {
  id: integer('id').primaryKey(),
  sourceRecordId: integer('source_record_id').notNull().references(() => sourceRecords.id),
  changeType: text('change_type').notNull(),
  changeSummary: text('change_summary'),
  previousVersionId: integer('previous_version_id'),
  observedPublishedAt: timestamp('observed_published_at', { withTimezone: true }),
  retrievedAt: timestamp('retrieved_at', { withTimezone: true }).notNull(),
  checksum: text('checksum'),
  reviewState: text('review_state').notNull(),
}, (table) => [
  unique('source_versions_id_record_unique').on(table.id, table.sourceRecordId),
  foreignKey({
    columns: [table.previousVersionId, table.sourceRecordId],
    foreignColumns: [table.id, table.sourceRecordId],
    name: 'source_version_predecessor_fk',
  }),
  uniqueIndex('source_version_original_approved_unique')
    .on(table.sourceRecordId)
    .where(sql`${table.changeType} = 'original' and ${table.reviewState} = 'approved'`),
  check('source_version_change_type_check', sql`${table.changeType} in ('original', 'edition', 'update', 'translation', 'correction')`),
  check('source_version_predecessor_check', sql`(${table.changeType} = 'original' and ${table.previousVersionId} is null and ${table.changeSummary} is null) or (${table.changeType} <> 'original' and ${table.previousVersionId} is not null and ${table.changeSummary} is not null)`),
]);

export const sourceVersionLocations = pgTable('source_version_locations', {
  id: integer('id').primaryKey(),
  sourceVersionId: integer('source_version_id').notNull().references(() => sourceVersions.id),
  url: text('url').notNull(),
  locationType: text('location_type').notNull(),
  reviewState: text('review_state').notNull(),
}, (table) => [
  unique('source_version_location_unique').on(table.sourceVersionId, table.url),
  check('source_version_location_type_check', sql`${table.locationType} in ('original', 'mirror')`),
]);

export const sourceReuse = pgTable('source_reuse', {
  id: integer('id').primaryKey(),
  sourceVersionId: integer('source_version_id').notNull().references(() => sourceVersions.id),
  materialType: text('material_type').notNull(),
  retainedMaterial: text('retained_material').notNull(),
  reuseBasis: text('reuse_basis').notNull(),
  requiredAttribution: text('required_attribution').notNull(),
  reviewState: text('review_state').notNull(),
});

export const publicClaims = pgTable('public_claims', {
  id: integer('id').primaryKey(),
  summary: text('summary').notNull(),
  statementFrom: timestamp('statement_from', { withTimezone: true }),
  statementFromPrecision: text('statement_from_precision').notNull(),
  statementTo: timestamp('statement_to', { withTimezone: true }),
  statementToPrecision: text('statement_to_precision').notNull(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  reviewState: text('review_state').notNull(),
}, (table) => [
  check('public_claim_summary_check', sql`btrim(${table.summary}) <> ''`),
  check('public_claim_statement_from_precision_check', sql`(${table.statementFromPrecision} = 'unknown') = (${table.statementFrom} is null)`),
  check('public_claim_statement_to_precision_check', sql`(${table.statementToPrecision} = 'unknown') = (${table.statementTo} is null)`),
  check('public_claim_statement_precision_check', sql`${table.statementFromPrecision} in ('day', 'month', 'year', 'unknown') and ${table.statementToPrecision} in ('day', 'month', 'year', 'unknown')`),
  check('public_claim_statement_dates_check', sql`${table.statementTo} is null or ${table.statementFrom} is null or ${table.statementTo} >= ${table.statementFrom}`),
  check('public_claim_review_check', sql`${table.reviewState} <> 'approved' or ${table.reviewedAt} is not null`),
]);

export const policyPositions = pgTable('policy_positions', {
  publicClaimId: integer('public_claim_id').primaryKey().references(() => publicClaims.id),
  topic: text('topic').notNull(),
}, (table) => [
  check('policy_position_topic_check', sql`btrim(${table.topic}) <> ''`),
]);

export const publicClaimSpeakers = pgTable('public_claim_speakers', {
  publicClaimId: integer('public_claim_id').notNull().references(() => publicClaims.id),
  politicalActorId: integer('political_actor_id').notNull().references(() => politicalActors.id),
}, (table) => [
  primaryKey({ columns: [table.publicClaimId, table.politicalActorId] }),
]);

export const publicClaimSubjects = pgTable('public_claim_subjects', {
  publicClaimId: integer('public_claim_id').notNull().references(() => publicClaims.id),
  politicalActorId: integer('political_actor_id').notNull().references(() => politicalActors.id),
}, (table) => [
  primaryKey({ columns: [table.publicClaimId, table.politicalActorId] }),
]);

export const evidenceCitations = pgTable('evidence_citations', {
  id: integer('id').primaryKey(),
  publicClaimId: integer('public_claim_id').notNull().references(() => publicClaims.id),
  sourceVersionId: integer('source_version_id').notNull().references(() => sourceVersions.id),
  locatorType: text('locator_type').notNull(),
  locator: text('locator').notNull(),
  locatorPrecision: text('locator_precision').notNull(),
  precisionExplanation: text('precision_explanation'),
  reviewState: text('review_state').notNull(),
}, (table) => [
  unique('evidence_citation_unique').on(table.publicClaimId, table.sourceVersionId, table.locatorType, table.locator),
  check('evidence_citation_locator_type_check', sql`${table.locatorType} in ('quotation', 'page', 'timestamp', 'section', 'other')`),
  check('evidence_citation_locator_precision_check', sql`${table.locatorPrecision} in ('exact', 'best_available')`),
  check('evidence_citation_locator_check', sql`btrim(${table.locator}) <> '' and (${table.locatorPrecision} = 'exact' or (${table.precisionExplanation} is not null and btrim(${table.precisionExplanation}) <> ''))`),
]);

export const quotations = pgTable('quotations', {
  id: integer('id').primaryKey(),
  evidenceCitationId: integer('evidence_citation_id').notNull().references(() => evidenceCitations.id),
  sourceLanguage: text('source_language').notNull(),
  textDirection: text('text_direction').notNull(),
  text: text('text').notNull(),
  reviewState: text('review_state').notNull(),
}, (table) => [
  check('quotation_content_check', sql`btrim(${table.sourceLanguage}) <> '' and btrim(${table.text}) <> ''`),
  check('quotation_direction_check', sql`${table.textDirection} in ('ltr', 'rtl')`),
]);

export const quotationTranslations = pgTable('quotation_translations', {
  id: integer('id').primaryKey(),
  quotationId: integer('quotation_id').notNull().references(() => quotations.id),
  language: text('language').notNull(),
  textDirection: text('text_direction').notNull(),
  text: text('text').notNull(),
  machineAssisted: boolean('machine_assisted').notNull().default(false),
  reviewState: text('review_state').notNull(),
}, (table) => [
  uniqueIndex('quotation_translation_approved_language_unique')
    .on(table.quotationId, table.language)
    .where(sql`${table.reviewState} = 'approved'`),
  check('quotation_translation_content_check', sql`btrim(${table.language}) <> '' and btrim(${table.text}) <> ''`),
  check('quotation_translation_direction_check', sql`${table.textDirection} in ('ltr', 'rtl')`),
]);
