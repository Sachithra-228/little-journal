"use client";

import { moodOptions } from "@/lib/diary";
import type { DiaryMood } from "@/types/diary";

interface MoodSelectorProps {
  value: DiaryMood;
  onChange: (value: DiaryMood) => void;
}

export function MoodSelector({ value, onChange }: MoodSelectorProps) {
  return (
    <fieldset className="mood-selector">
      <legend>Mood</legend>
      <div>
        {moodOptions.map((option) => (
          <button
            key={option.mood}
            type="button"
            className={value === option.mood ? "mood-pill active" : "mood-pill"}
            onClick={() => onChange(option.mood)}
            aria-pressed={value === option.mood}
          >
            {option.mood}
          </button>
        ))}
      </div>
    </fieldset>
  );
}
