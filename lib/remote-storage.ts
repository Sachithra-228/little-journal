import type { DiaryEntry } from "@/types/diary";

export type RemoteStorageResult =
  | { ok: true; entries: DiaryEntry[] }
  | { ok: false; reason: string };

export type RemoteSaveResult =
  | { ok: true }
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

export async function saveRemoteEntries(entries: DiaryEntry[]): Promise<RemoteSaveResult> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch("/api/entries", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ entries }),
      signal: controller.signal
    });

    if (response.ok) {
      return { ok: true };
    }

    const data = (await response.json().catch(() => null)) as { message?: string } | null;
    return { ok: false, reason: data?.message ?? "Could not sync with MongoDB." };
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return { ok: false, reason: "MongoDB sync timed out." };
    }

    return { ok: false, reason: "Could not reach MongoDB sync." };
  } finally {
    window.clearTimeout(timeout);
  }
}
