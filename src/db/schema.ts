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
