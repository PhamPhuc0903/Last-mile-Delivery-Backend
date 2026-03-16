import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DB_URL
});

pool.on("error", (err) => {
  throw err;
});

export default {
  query: (text, params) => pool.query(text, params)
}