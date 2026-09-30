import { NextResponse } from "next/server";
import { getDatabaseName, getMongoClient, hasMongoConfig } from "@/lib/mongodb";
import { verifyOwnerPattern } from "@/lib/owner-auth";
import { normalizeEntries } from "@/lib/storage";
import { sortEntries } from "@/lib/diary";
import type { DiaryEntry } from "@/types/diary";

const COLLECTION = "entries";

export const runtime = "nodejs";

export async function GET() {
  if (!hasMongoConfig()) {
    return NextResponse.json(
      { entries: [], message: "MongoDB is not configured." },
      { status: 503 }
    );
  }

  try {
    const collection = await getEntriesCollection();
    const entries = await collection
      .find({}, { projection: { _id: 0 } })
      .sort({ date: -1 })
      .toArray();

    return NextResponse.json({ entries: normalizeEntries(entries) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown MongoDB error.";
    return NextResponse.json(
      { entries: [], message: `Could not load memories from MongoDB: ${message}` },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  if (!process.env.OWNER_PATTERN) {
    return NextResponse.json(
      { entries: [], message: "Owner pattern is not configured." },
      { status: 503 }
    );
  }

  if (!verifyOwnerPattern(request.headers.get("x-owner-pattern") ?? "")) {
    return NextResponse.json(
      { entries: [], message: "Owner unlock is required." },
      { status: 401 }
    );
  }

  if (!hasMongoConfig()) {
    return NextResponse.json(
      { entries: [], message: "MongoDB is not configured." },
      { status: 503 }
    );
  }

  try {
    const body = (await request.json()) as { entries?: unknown };
    const entries = sortEntries(normalizeEntries(body.entries));
    const collection = await getEntriesCollection();
    const ids = entries.map((entry) => entry.id);

    await collection.createIndex({ date: 1 }, { unique: true });

    if (ids.length === 0) {
      await collection.deleteMany({});
      return NextResponse.json({ entries: [] });
    }

    await collection.deleteMany({ id: { $nin: ids } });
    await collection.bulkWrite(
      entries.map((entry) => ({
        replaceOne: {
          filter: { id: entry.id },
          replacement: entry,
          upsert: true
        }
      }))
    );

    return NextResponse.json({ entries });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown MongoDB error.";
    return NextResponse.json(
      { entries: [], message: `Could not save memories to MongoDB: ${message}` },
      { status: 500 }
    );
  }
}

async function getEntriesCollection() {
  const client = await getMongoClient();
  return client.db(getDatabaseName()).collection<DiaryEntry>(COLLECTION);
}
