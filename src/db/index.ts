import { drizzle as drizzleVercel } from 'drizzle-orm/vercel-postgres';
import { drizzle as drizzleNode } from 'drizzle-orm/node-postgres';
import { sql } from '@vercel/postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Use local PostgreSQL if POSTGRES_URL starts with postgres:// (local)
// Otherwise use Vercel Postgres (production)
const isLocal = process.env.POSTGRES_URL?.startsWith('postgres://localhost') ||
                process.env.POSTGRES_URL?.startsWith('postgresql://localhost') ||
                process.env.USE_LOCAL_DB === 'true';

export const db = isLocal
  ? drizzleNode(new Pool({ connectionString: process.env.POSTGRES_URL }), { schema })
  : drizzleVercel(sql, { schema });

export * from './schema';
