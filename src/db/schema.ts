import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const applicationReadiness = pgTable('application_readiness', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});
