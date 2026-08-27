import pg from 'pg';
async function run() {
  const pool = new pg.Client(process.env.DATABASE_URL);
  await pool.connect();
  const res = await pool.query("SELECT * FROM pg_policies WHERE tablename = 'profiles'");
  console.log(res.rows);
  await pool.end();
}
run().catch(console.error);
