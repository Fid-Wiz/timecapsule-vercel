import { NextResponse } from "next/server";
import { pool } from "@/lib/db";

export async function GET() {
  try {
    const [dbRow]: any = await pool.query("SELECT DATABASE() AS db");
    const currentDb = dbRow[0]?.db || null;
    const [tables]: any = await pool.query("SHOW TABLES");
    return NextResponse.json({
      envDatabase: process.env.TIDB_DATABASE || null,
      currentDb,
      tables: tables.map((t: any) => Object.values(t)[0]),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
