export type DayType = "onsite" | "remote" | "leave";

export interface Journal {
  id: string;
  name: string;
  // Work diaries track onsite / work-from-home / leave days on their calendar.
  kind: "work" | "personal";
}

// Add a line here to give another company its own tab and calendar.
export const journals: Journal[] = [
  { id: "sandbox", name: "Sandbox", kind: "work" },
  { id: "personal", name: "Personal", kind: "personal" }
];

export const DEFAULT_JOURNAL = "sandbox";

// Hidden from visitors unless the owner makes it public.
export const PRIVATE_JOURNAL = "personal";

export const dayTypes: DayType[] = ["onsite", "remote", "leave"];

export const leaveReasons = ["Sick", "Personal", "Holiday", "Other"];

export function getJournal(id: string) {
  return journals.find((journal) => journal.id === id) ?? journals[0];
}

export function isWorkJournal(id: string) {
  return getJournal(id).kind === "work";
}

export function isKnownJournal(id: unknown): id is string {
  return typeof id === "string" && journals.some((journal) => journal.id === id);
}
