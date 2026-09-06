import { NextResponse } from "next/server";
import { getStore } from "@/lib/store";
import { ensureSchema, syncStoreToSnowflake } from "@/lib/snowflake";
import type { StoreData } from "@/lib/types";

export async function POST() {
  let data: StoreData;
  try {
    data = await getStore();
  } catch (e) {
    return NextResponse.json({ ok: false, error: `Local store: ${String(e)}` }, { status: 500 });
  }
  try {
    await ensureSchema();
    await syncStoreToSnowflake(data);
    return NextResponse.json({ ok: true, message: "Store synced to Snowflake" });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: String(e instanceof Error ? e.message : e) },
      { status: 502 }
    );
  }
}