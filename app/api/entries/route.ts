import { NextResponse } from "next/server";
import {
  ensureEntrySchema,
  getEntriesCollection,
  isPersonalPublic,
  isStoredImageUrl,
  withImageUrls
} from "@/lib/entries-db";
import { PRIVATE_JOURNAL } from "@/lib/journals";
import { hasMongoConfig } from "@/lib/mongodb";
import { verifyOwnerPattern } from "@/lib/owner-auth";
import { normalizeEntries, normalizeEntry } from "@/lib/storage";
import type { DiaryEntry } from "@/types/diary";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!hasMongoConfig()) {
    return NextResponse.json(
      { entries: [], message: "MongoDB is not configured." },
      { status: 503 }
    );
  }

  try {
    await ensureEntrySchema();
    // Visitors never receive the personal diary unless the owner made it public.
    const personalPublic = await isPersonalPublic();
    const isOwner = verifyOwnerPattern(request.headers.get("x-owner-pattern") ?? "");
    const match = isOwner || personalPublic ? {} : { journal: { $ne: PRIVATE_JOURNAL } };

    const collection = await getEntriesCollection();
    const entries = await collection
      .aggregate<DiaryEntry>([
        { $match: match },
        { $sort: { date: -1 } },
        {
          $set: {
            images: {
              $map: {
                input: { $ifNull: ["$images", []] },
                as: "image",
                in: { id: "$$image.id", name: "$$image.name", alt: "$$image.alt", dataUrl: "" }
              }
            }
          }
        },
        { $project: { _id: 0 } }
      ])
      .toArray();

    return NextResponse.json({
      entries: normalizeEntries(entries).map(withImageUrls),
      personalPublic
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown MongoDB error.";
    return NextResponse.json(
      { entries: [], message: `Could not load memories from MongoDB: ${message}` },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const denied = checkOwner(request);
  if (denied) {
    return denied;
  }

  try {
    const body = (await request.json()) as { entry?: unknown };
    const entry = normalizeEntry(body.entry);

    if (!entry) {
      return NextResponse.json({ message: "That memory could not be read." }, { status: 400 });
    }

    await ensureEntrySchema();
    const collection = await getEntriesCollection();

    // Photos already on the server arrive as links; keep their stored data.
    const stored = await collection.findOne({ id: entry.id }, { projection: { images: 1 } });
    const storedImages = new Map(
      (stored?.images ?? []).map((image) => [image.id, image.dataUrl])
    );
    const images = entry.images.flatMap((image) => {
      if (!isStoredImageUrl(image.dataUrl)) {
        return [image];
      }

      const dataUrl = storedImages.get(image.id);
      return dataUrl ? [{ ...image, dataUrl }] : [];
    });

    const saved = { ...entry, images };
    await collection.replaceOne({ id: entry.id }, saved, { upsert: true });

    return NextResponse.json({ entry: withImageUrls(saved) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown MongoDB error.";
    return NextResponse.json(
      { message: `Could not save the memory to MongoDB: ${message}` },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const denied = checkOwner(request);
  if (denied) {
    return denied;
  }

  const id = new URL(request.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ message: "Missing memory id." }, { status: 400 });
  }

  try {
    const collection = await getEntriesCollection();
    await collection.deleteOne({ id });
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown MongoDB error.";
    return NextResponse.json(
      { message: `Could not delete the memory from MongoDB: ${message}` },
      { status: 500 }
    );
  }
}

function checkOwner(request: Request) {
  if (!process.env.OWNER_PATTERN) {
    return NextResponse.json({ message: "Owner pattern is not configured." }, { status: 503 });
  }

  if (!verifyOwnerPattern(request.headers.get("x-owner-pattern") ?? "")) {
    return NextResponse.json({ message: "Owner unlock is required." }, { status: 401 });
  }

  if (!hasMongoConfig()) {
    return NextResponse.json({ message: "MongoDB is not configured." }, { status: 503 });
  }

  return null;
}
