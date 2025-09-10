import mysql from "mysql2/promise";

export const pool = mysql.createPool({
  host: process.env.TIDB_HOST,
  port: Number(process.env.TIDB_PORT || 4000),
  user: process.env.TIDB_USER,
  password: process.env.TIDB_PASSWORD,
  database: process.env.TIDB_DATABASE, // "test" for now
  ssl: process.env.TIDB_ENABLE_SSL === "true" ? { minVersion: "TLSv1.2" } : undefined,
  enableKeepAlive: true,
  supportBigNumbers: true,
});
