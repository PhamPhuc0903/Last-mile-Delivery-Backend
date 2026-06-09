import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

pool.on("error", (err) => {
  console.error("PostgreSQL error:", err);
});

export const query = (text, params) =>
    pool.query(text, params);