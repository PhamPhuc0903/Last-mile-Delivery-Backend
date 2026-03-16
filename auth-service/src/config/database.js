import pkg from "pg";

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DB_URL
});

pool.on("connect", () => {
  console.log("Auth-service connected to PostgreSQL");
});

pool.on("error", (err) => {
  console.error("PostgreSQL error:", err);
});

export default {
  query: (text, params) => pool.query(text, params)
};