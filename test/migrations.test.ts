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

test('migration runner is compatible with the repository CommonJS tsx runtime', async () => {
  const runner = await readFile('scripts/migrate.ts', 'utf8');
  assert.doesNotMatch(runner, /^await /m);
  assert.match(runner, /async function main\(\)/);
});

test('database client is reusable by the standalone migration script', async () => {
  const client = await readFile('src/db/client.ts', 'utf8');
  assert.doesNotMatch(client, /^import 'server-only';/m);
});
