import { sql } from 'drizzle-orm';
import {
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
