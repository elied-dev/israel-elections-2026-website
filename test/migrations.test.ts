import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import assert from 'node:assert/strict';

test('migration creates and seeds the readiness table', async () => {
  const migration = await readFile('drizzle/0000_mean_blockbuster.sql', 'utf8');
  assert.match(migration, /CREATE TABLE "application_readiness"/);
  assert.match(migration, /INSERT INTO "application_readiness"/);
});

test('directory migration creates an edition without inventing lists', async () => {
  const migration = await readFile('drizzle/0001_green_barracuda.sql', 'utf8');
  assert.match(migration, /CREATE TABLE "election_editions"/);
  assert.match(migration, /CREATE TABLE "electoral_lists"/);
  assert.match(migration, /INSERT INTO "election_editions"/);
  assert.doesNotMatch(migration, /INSERT INTO "electoral_lists"/);
});

test('the political actor backfill for existing Electoral Lists runs before the electoral_lists political actor foreign key', async () => {
  const migration = await readFile('drizzle/0002_electoral-list-profiles.sql', 'utf8');
  const backfillIndex = migration.indexOf('INSERT INTO "political_actors"');
  const slugBackfillIndex = migration.indexOf('INSERT INTO "political_actor_slugs"');
  const foreignKeyIndex = migration.indexOf('electoral_lists_id_political_actors_id_fk');

  assert.ok(backfillIndex > 0, 'expected a political_actors backfill INSERT');
  assert.ok(slugBackfillIndex > backfillIndex, 'expected the slug backfill to follow the actor backfill');
  assert.ok(
    foreignKeyIndex > slugBackfillIndex,
    'the backfill must run before the FK is added, or existing Electoral Lists would violate it and the migration would fail',
  );

  // The hand-edited backfill must explain itself in the migration file, since a
  // future `db:generate` re-run would not know to reproduce this ordering.
  assert.match(
    migration,
    /backfill[\s\S]*before[\s\S]*(foreign key|fk)|(foreign key|fk)[\s\S]*after[\s\S]*backfill/i,
  );
});

test('migration runner is compatible with the repository CommonJS tsx runtime', async () => {
  const runner = await readFile('scripts/migrate.ts', 'utf8');
  assert.doesNotMatch(runner, /^await /m);
  assert.match(runner, /async function main\(\)/);
});

test('database client is reusable by the standalone migration script', async () => {
  const client = await readFile('src/db/client.ts', 'utf8');
  assert.doesNotMatch(client, /^import 'server-only';/m);
});
