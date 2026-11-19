import { isWorkJournal, type DayType } from "@/lib/journals";
import type { DiaryDraft, DiaryEntry } from "@/types/diary";
import { createId, monthKey, yearKey } from "@/lib/utils";

export const ONSITE_LOCATION = "Sandbox Office, Ethul Kotte";
export const HOME_LOCATION = "Work from home";

// "Sandbox Office" alone is too vague for Google Maps, so map the full address.
const ONSITE_MAP_QUERY = "Sandbox Consultancy Services, 11B, 9th Lane, Ethul Kotte, Sri Lanka";

// Pages written before day types existed get one from their place. Older pages
// spell the office several ways ("Sandbox Consultancy Services, 11B, ...").
export function deriveDayType(location: string): DayType | undefined {
  if (location === ONSITE_LOCATION || /\bsandbox\b/i.test(location)) {
    return "onsite";
  }

  return location === HOME_LOCATION || /\bhome\b/i.test(location) ? "remote" : undefined;
}

export function getMapQuery(location: string, point?: { lat: number; lng: number }) {
  if (point) {
    return `${point.lat},${point.lng}`;
  }

  return location === ONSITE_LOCATION ? ONSITE_MAP_QUERY : location;
}

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

export function getEntryByDate(entries: DiaryEntry[], date: string, journal: string) {
  return entries.find((entry) => entry.date === date && entry.journal === journal) ?? null;
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
    const matchesMonth = !filters.month || monthKey(entry.date) === filters.month;
    const matchesYear = !filters.year || yearKey(entry.date) === filters.year;

    return matchesQuery && matchesMonth && matchesYear;
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
  const dayType = isWorkJournal(draft.journal) ? draft.dayType : undefined;

  return {
    journal: draft.journal,
    dayType,
    leaveReason: dayType === "leave" ? draft.leaveReason : undefined,
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
