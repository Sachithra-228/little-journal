import type { DiaryEntry, DiaryMood } from "@/types/diary";

export const STORAGE_KEY = "little-journal-entries";

const validMoods: DiaryMood[] = [
  "Happy",
  "Calm",
  "Excited",
  "Grateful",
  "Sad",
  "Tired",
  "Normal",
  "Motivated"
];

export function getEntries(): DiaryEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return normalizeEntries(parsed);
  } catch {
    return [];
  }
}

export function saveEntries(entries: DiaryEntry[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

export function getEntryByDate(date: string) {
  return getEntries().find((entry) => entry.date === date) ?? null;
}

export function getEntryById(id: string) {
  return getEntries().find((entry) => entry.id === id) ?? null;
}

export function normalizeEntries(value: unknown): DiaryEntry[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.map(normalizeEntry).filter(Boolean) as DiaryEntry[];
}

export function normalizeEntry(value: unknown): DiaryEntry | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const maybe = value as Partial<DiaryEntry>;
  if (
    typeof maybe.id !== "string" ||
    typeof maybe.date !== "string" ||
    typeof maybe.title !== "string" ||
    typeof maybe.content !== "string"
  ) {
    return null;
  }

  return {
    id: maybe.id,
    date: maybe.date,
    title: maybe.title,
    content: maybe.content,
    mood: validMoods.includes(maybe.mood as DiaryMood)
      ? (maybe.mood as DiaryMood)
      : "Normal",
    location: typeof maybe.location === "string" ? maybe.location : "",
    locationPoint: normalizeLocationPoint(maybe.locationPoint),
    tags: Array.isArray(maybe.tags)
      ? maybe.tags.filter((tag): tag is string => typeof tag === "string")
      : [],
    images: Array.isArray(maybe.images)
      ? maybe.images.filter(
          (image) =>
            image &&
            typeof image.id === "string" &&
            typeof image.dataUrl === "string" &&
            typeof image.name === "string"
        )
      : [],
    createdAt:
      typeof maybe.createdAt === "string" ? maybe.createdAt : new Date().toISOString(),
    updatedAt:
      typeof maybe.updatedAt === "string" ? maybe.updatedAt : new Date().toISOString()
  };
}

function normalizeLocationPoint(value: unknown) {
  if (!value || typeof value !== "object") {
    return undefined;
  }

  const maybe = value as { lat?: unknown; lng?: unknown; accuracy?: unknown };
  if (typeof maybe.lat !== "number" || typeof maybe.lng !== "number") {
    return undefined;
  }

  return {
    lat: maybe.lat,
    lng: maybe.lng,
    accuracy: typeof maybe.accuracy === "number" ? maybe.accuracy : undefined
  };
}
