// src/db.js
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString:
    process.env.POSTGRES_URL ||
    "postgres://postgres:mypassword@localhost:5432/mydatabase",
});

export default async function sql(strings, ...values) {
  // Handle plain string queries (e.g., sql(queryText, ...params))
  if (typeof strings === 'string') {
    const res = await pool.query(strings, values);
    return res.rows;
  }

  // Handle tagged template literals (e.g., sql`SELECT * FROM table WHERE id = ${id}`)
  let text = "";
  for (let i = 0; i < strings.length; i++) {
    text += strings[i];
    if (i < values.length) {
      text += `$${i + 1}`;
    }
  }

  const res = await pool.query(text, values);
  return res.rows;
}