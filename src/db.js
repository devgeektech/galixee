// src/db.js
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString:
    process.env.POSTGRES_URL ||
    "postgres://postgres:mypassword@localhost:5432/mydatabase",
});

// A proper tagged template function for parameterized queries
export default async function sql(strings, ...values) {
  let text = "";
  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) {
      text += `$${i + 1}`; // ✅ PostgreSQL placeholders start from $1
    }
  }

  const res = await pool.query(text, values);
  return res.rows;
}
