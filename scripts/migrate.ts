import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { getDb } from '../src/db/client';

async function main() {
  await migrate(getDb(), { migrationsFolder: './drizzle' });
  console.log('Database migrations applied.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
