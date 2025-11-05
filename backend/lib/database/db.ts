/**
 * Database client and connection utilities
 */

import { Pool, QueryResult } from 'pg';

let pool: Pool | null = null;

/**
 * Get or create database connection pool
 */
export function getDbPool(): Pool {
  if (!pool) {
    const connectionString = process.env.POSTGRES_URL;

    if (!connectionString) {
      throw new Error('POSTGRES_URL environment variable is not set');
    }

    pool = new Pool({
      connectionString,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected database error:', err);
      process.exit(-1);
    });
  }

  return pool;
}

/**
 * Execute a database query
 */
export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const pool = getDbPool();
  const start = Date.now();

  try {
    const result = await pool.query<T>(text, params);
    const duration = Date.now() - start;

    console.log('Query executed', {
      text,
      duration: `${duration}ms`,
      rows: result.rowCount,
    });

    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

/**
 * Close database connection pool
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
