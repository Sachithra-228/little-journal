import type { DayType } from "@/lib/journals";

export type DiaryMood =
  | "Happy"
  | "Calm"
  | "Excited"
  | "Grateful"
  | "Sad"
  | "Tired"
  | "Normal"
  | "Motivated";

export interface DiaryImage {
  id: string;
  dataUrl: string;
  name: string;
  alt: string;
}

export interface DiaryLocationPoint {
  lat: number;
  lng: number;
  accuracy?: number;
}

export interface DiaryEntry {
  id: string;
  journal: string;
  date: string;
  title: string;
  content: string;
  mood: DiaryMood;
  location: string;
  locationPoint?: DiaryLocationPoint;
  tags: string[];
  images: DiaryImage[];
  dayType?: DayType;
  leaveReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiaryDraft {
  journal: string;
  date: string;
  title: string;
  content: string;
  mood: DiaryMood;
  location: string;
  locationPoint?: DiaryLocationPoint;
  tags: string[];
  images: DiaryImage[];
  dayType?: DayType;
  leaveReason?: string;
}

export interface MemoryFilters {
  query: string;
  month: string;
  year: string;
}

export interface DiaryTask {
  id: string;
  journal: string;
  text: string;
  done: boolean;
  // The day the task was added, and the day it was ticked off.
  date: string;
  doneDate?: string;
  createdAt: string;
}
