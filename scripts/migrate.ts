import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { getDb } from '../src/db/client';

await migrate(getDb(), { migrationsFolder: './drizzle' });
console.log('Database migrations applied.');
process.exit(0);
