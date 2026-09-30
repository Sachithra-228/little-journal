import type { DiaryEntry } from "@/types/diary";

export type RemoteStorageResult =
  | { ok: true; entries: DiaryEntry[] }
  | { ok: false; reason: string };

export async function fetchRemoteEntries(): Promise<RemoteStorageResult> {
  try {
    const response = await fetch("/api/entries", { cache: "no-store" });
    if (!response.ok) {
      return { ok: false, reason: "MongoDB is not connected yet." };
    }

    const data = (await response.json()) as { entries?: DiaryEntry[] };
    return { ok: true, entries: Array.isArray(data.entries) ? data.entries : [] };
  } catch {
    return { ok: false, reason: "Using this browser as your journal home." };
  }
}

export async function saveRemoteEntries(entries: DiaryEntry[]) {
  try {
    const response = await fetch("/api/entries", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ entries })
    });

    return response.ok;
  } catch {
    return false;
  }
}
