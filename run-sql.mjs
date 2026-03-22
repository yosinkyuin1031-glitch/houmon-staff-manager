import pg from 'pg';
import { readFileSync } from 'fs';

const client = new pg.Client({
  connectionString: 'postgresql://postgres:fJZj8SDawfJze7H9@db.vzkfkazjylrkspqrnhnx.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

const sql = readFileSync('supabase-setup.sql', 'utf8');
await client.connect();
try {
  // Split by semicolons and execute each statement
  const stmts = sql.split(';').map(s => s.trim()).filter(s => s.length > 0 && !s.startsWith('--'));
  for (const stmt of stmts) {
    try {
      await client.query(stmt);
      console.log('OK:', stmt.slice(0, 60));
    } catch (e) {
      console.log('ERR:', e.message, ':', stmt.slice(0, 60));
    }
  }
} finally {
  await client.end();
}
