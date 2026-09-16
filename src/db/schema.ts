import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

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

export const electoralLists = pgTable('electoral_lists', {
  id: integer('id').primaryKey(),
  editionId: integer('edition_id').notNull().references(() => electionEditions.id),
  name: text('name').notNull(),
  ballotIdentifier: text('ballot_identifier'),
  sourceId: integer('source_id').references(() => authoritativeSources.id),
  reviewState: text('review_state').notNull(),
});
