import { DEFAULT_JOURNAL } from "@/lib/journals";
import { getDatabaseName, getMongoClient } from "@/lib/mongodb";
import type { DiaryEntry } from "@/types/diary";

const IMAGE_ROUTE = "/api/images/";
const SETTINGS_ID = "journals";

let schemaReady: Promise<void> | null = null;

export async function getEntriesCollection() {
  const client = await getMongoClient();
  return client.db(getDatabaseName()).collection<DiaryEntry>("entries");
}

async function getSettingsCollection() {
  const client = await getMongoClient();
  return client
    .db(getDatabaseName())
    .collection<{ _id: string; personalPublic?: boolean }>("settings");
}

// Runs once per server: pages from before separate diaries become Sandbox pages,
// and "one page per date" becomes "one page per date in each diary".
export function ensureEntrySchema() {
  schemaReady ??= (async () => {
    const collection = await getEntriesCollection();
    await collection.updateMany(
      { journal: { $exists: false } },
      { $set: { journal: DEFAULT_JOURNAL } }
    );

    const indexes = await collection.indexes();
    if (indexes.some((index) => index.name === "date_1")) {
      await collection.dropIndex("date_1");
    }
    await collection.createIndex({ journal: 1, date: 1 }, { unique: true });
  })().catch((error) => {
    schemaReady = null;
    throw error;
  });

  return schemaReady;
}

export async function isPersonalPublic() {
  const settings = await getSettingsCollection();
  const doc = await settings.findOne({ _id: SETTINGS_ID });
  return doc?.personalPublic === true;
}

export async function setPersonalPublic(personalPublic: boolean) {
  const settings = await getSettingsCollection();
  await settings.updateOne({ _id: SETTINGS_ID }, { $set: { personalPublic } }, { upsert: true });
}

export function getImageUrl(imageId: string) {
  return `${IMAGE_ROUTE}${encodeURIComponent(imageId)}`;
}

// Photos live in MongoDB as data URLs; clients get a link per photo instead,
// so loading or saving one memory never carries every photo in the diary.
export function withImageUrls(entry: DiaryEntry): DiaryEntry {
  return {
    ...entry,
    images: entry.images.map((image) => ({ ...image, dataUrl: getImageUrl(image.id) }))
  };
}

export function isStoredImageUrl(value: string) {
  return value.startsWith(IMAGE_ROUTE);
}
