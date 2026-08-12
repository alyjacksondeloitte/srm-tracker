import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '../data');

// ── File-based storage (local development) ────────────────────────

function ensureDir() {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
}

function readFile(filename, fallback = []) {
  ensureDir();
  const path = join(DATA_DIR, filename);
  if (!existsSync(path)) return fallback;
  try { return JSON.parse(readFileSync(path, 'utf8')); }
  catch { return fallback; }
}

function writeFile(filename, data) {
  ensureDir();
  const path = join(DATA_DIR, filename);
  const backup = join(DATA_DIR, filename.replace('.json', '-backup.json'));
  if (existsSync(path)) {
    try { writeFileSync(backup, readFileSync(path)); } catch {}
  }
  writeFileSync(path, JSON.stringify(data, null, 2));
}

// ── PostgreSQL storage (production / Render) ──────────────────────

let pool = null;

if (process.env.DATABASE_URL) {
  // Dynamically import pg so it's optional in local dev
  const { default: pg } = await import('pg');
  pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  // Single key-value table — stores tasks and pto as JSON blobs
  await pool.query(`
    CREATE TABLE IF NOT EXISTS store (
      key   TEXT PRIMARY KEY,
      value JSONB NOT NULL DEFAULT '[]'
    );
    INSERT INTO store (key, value) VALUES ('tasks', '[]'), ('pto', '[]')
    ON CONFLICT (key) DO NOTHING;
  `);

  console.log('Connected to PostgreSQL');
}

async function dbGet(key) {
  const res = await pool.query('SELECT value FROM store WHERE key = $1', [key]);
  return res.rows[0]?.value ?? [];
}

async function dbSet(key, value) {
  await pool.query(
    'INSERT INTO store (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = $2',
    [key, JSON.stringify(value)]
  );
}

// ── Exports — work in both modes ──────────────────────────────────

export const getTasks  = () => pool ? dbGet('tasks')      : Promise.resolve(readFile('tasks.json'));
export const saveTasks = t  => pool ? dbSet('tasks', t)   : Promise.resolve(writeFile('tasks.json', t));
export const getPTO    = () => pool ? dbGet('pto')        : Promise.resolve(readFile('pto.json'));
export const savePTO   = r  => pool ? dbSet('pto', r)     : Promise.resolve(writeFile('pto.json', r));
