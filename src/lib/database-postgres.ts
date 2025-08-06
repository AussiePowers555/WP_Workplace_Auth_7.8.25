import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

const connectionString = process.env.DATABASE_URL;

let pool: Pool | null = null;

if (connectionString) {
  pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });
}

export async function initializePostgresDatabase() {
  if (!pool) {
    console.log('PostgreSQL not configured, skipping initialization');
    return;
  }

  try {
    // Read the schema file
    const schemaPath = path.join(process.cwd(), 'src', 'lib', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    // Split by semicolons but be careful with triggers and functions
    const statements = schema
      .split(/;\s*$/gm)
      .filter(stmt => stmt.trim())
      .map(stmt => stmt.trim() + ';');

    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await pool.query(statement);
        } catch (err: any) {
          // Ignore "already exists" errors
          if (!err.message?.includes('already exists')) {
            console.error('Error executing statement:', err.message);
          }
        }
      }
    }
    
    console.log('PostgreSQL database initialized successfully');
  } catch (error) {
    console.error('Error initializing PostgreSQL database:', error);
  }
}

export function getPostgresPool() {
  return pool;
}

export async function queryPostgres(text: string, params?: any[]) {
  if (!pool) {
    throw new Error('PostgreSQL pool not initialized');
  }
  
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('PostgreSQL query error:', error);
    throw error;
  }
}

export async function closePostgresConnection() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}