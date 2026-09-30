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

export interface DiaryEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: DiaryMood;
  location: string;
  tags: string[];
  images: DiaryImage[];
  createdAt: string;
  updatedAt: string;
}

export interface DiaryDraft {
  date: string;
  title: string;
  content: string;
  mood: DiaryMood;
  location: string;
  tags: string[];
  images: DiaryImage[];
}

export interface MemoryFilters {
  query: string;
  mood: "All" | DiaryMood;
  month: string;
  year: string;
}
