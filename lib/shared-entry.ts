import { cache } from "react";
import { ensureEntrySchema, getEntriesCollection, isPersonalPublic } from "@/lib/entries-db";
import { PRIVATE_JOURNAL, isKnownJournal } from "@/lib/journals";
import { hasMongoConfig } from "@/lib/mongodb";
import { normalizeEntry } from "@/lib/storage";
import type { DiaryEntry } from "@/types/diary";

export const getSharedEntry = cache(
  async (journal: string, date: string): Promise<DiaryEntry | null> => {
    if (!isKnownJournal(journal) || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !hasMongoConfig()) {
      return null;
    }

    try {
      // A private personal diary has no public pages at all.
      if (journal === PRIVATE_JOURNAL && !(await isPersonalPublic())) {
        return null;
      }

      await ensureEntrySchema();
      const collection = await getEntriesCollection();
      const entry = await collection.findOne({ journal, date }, { projection: { _id: 0 } });

      return normalizeEntry(entry);
    } catch {
      return null;
    }
  }
);

export function shareExcerpt(content: string, maxLength = 160) {
  const text = content.replace(/\s+/g, " ").trim();
  if (text.length <= maxLength) {
    return text;
  }

  return `${text
    .slice(0, maxLength)
    .replace(/\s+\S*$/, "")
    .replace(/[\s.,;:!?—-]+$/, "")}…`;
}
