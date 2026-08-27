import pg from 'pg';
async function run() {
  const pool = new pg.Client(process.env.DATABASE_URL);
  await pool.connect();
  const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'profiles'");
  console.log(res.rows.map(r => r.column_name));
  await pool.end();
}
run().catch(console.error);
