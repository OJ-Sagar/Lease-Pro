import { readFile } from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const { Client } = pg;

const connectionString = process.env.SUPABASE_DB_URL;
const shouldSeed = process.argv.includes('--seed');
const shouldRepair = process.argv.includes('--repair');

if (!connectionString) {
  console.error('Missing SUPABASE_DB_URL. Set it to your Supabase Postgres connection string.');
  process.exit(1);
}

const root = process.cwd();
const migrationPath = path.join(root, 'supabase', 'migrations', '202605230001_init_lease_pro.sql');
const seedPath = path.join(root, 'supabase', 'seed.sql');

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

try {
  await client.connect();
  console.log('Connected to Supabase Postgres.');
  const migration = await readFile(migrationPath, 'utf8');
  const sql = shouldRepair
    ? migration.slice(migration.indexOf('create view public.lease_contracts_overview'))
    : migration;

  await client.query(sql);
  console.log('Migration applied.');

  if (shouldSeed) {
    await client.query(await readFile(seedPath, 'utf8'));
    console.log('Seed data applied.');
  }
} finally {
  await client.end();
}
