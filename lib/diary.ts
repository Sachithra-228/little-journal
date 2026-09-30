import type { DiaryDraft, DiaryEntry, DiaryMood } from "@/types/diary";
import { createId, monthKey, yearKey } from "@/lib/utils";

export const moodOptions: Array<{ mood: DiaryMood }> = [
  { mood: "Happy" },
  { mood: "Calm" },
  { mood: "Excited" },
  { mood: "Grateful" },
  { mood: "Sad" },
  { mood: "Tired" },
  { mood: "Normal" },
  { mood: "Motivated" }
];

export const starterTags = [
  "Personal",
  "Work",
  "Friends",
  "Family",
  "Travel",
  "University",
  "Quiet",
  "Growth"
];

export function createEntry(draft: DiaryDraft): DiaryEntry {
  const now = new Date().toISOString();

  return {
    ...sanitizeDraft(draft),
    id: createId(),
    createdAt: now,
    updatedAt: now
  };
}

export function updateEntry(entry: DiaryEntry, draft: DiaryDraft): DiaryEntry {
  return {
    ...entry,
    ...sanitizeDraft(draft),
    updatedAt: new Date().toISOString()
  };
}

export function deleteEntry(entries: DiaryEntry[], id: string) {
  return entries.filter((entry) => entry.id !== id);
}

export function getEntryByDate(entries: DiaryEntry[], date: string) {
  return entries.find((entry) => entry.date === date) ?? null;
}

export function getEntryById(entries: DiaryEntry[], id: string) {
  return entries.find((entry) => entry.id === id) ?? null;
}

export function sortEntries(entries: DiaryEntry[]) {
  return [...entries].sort((a, b) => b.date.localeCompare(a.date));
}

export function filterEntries(
  entries: DiaryEntry[],
  filters: {
    query: string;
    mood: "All" | DiaryMood;
    month: string;
    year: string;
  }
) {
  const query = filters.query.trim().toLowerCase();

  return sortEntries(entries).filter((entry) => {
    const searchable = [
      entry.title,
      entry.content,
      entry.location,
      entry.tags.join(" ")
    ]
      .join(" ")
      .toLowerCase();

    const matchesQuery = !query || searchable.includes(query);
    const matchesMood = filters.mood === "All" || entry.mood === filters.mood;
    const matchesMonth = !filters.month || monthKey(entry.date) === filters.month;
    const matchesYear = !filters.year || yearKey(entry.date) === filters.year;

    return matchesQuery && matchesMood && matchesMonth && matchesYear;
  });
}

export function getMemoryStats(entries: DiaryEntry[]) {
  const months = new Set(entries.map((entry) => monthKey(entry.date)));
  const places = new Set(
    entries.map((entry) => entry.location.trim()).filter(Boolean)
  );

  return {
    memories: entries.length,
    months: months.size,
    places: places.size
  };
}

function sanitizeDraft(draft: DiaryDraft): DiaryDraft {
  return {
    date: draft.date,
    title: draft.title.trim() || "Untitled memory",
    content: draft.content.trim(),
    mood: draft.mood,
    location: draft.location.trim(),
    locationPoint: draft.locationPoint,
    tags: Array.from(
      new Set(draft.tags.map((tag) => tag.trim()).filter(Boolean))
    ).slice(0, 12),
    images: draft.images
  };
}
