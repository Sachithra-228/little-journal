"use client";

import { BookOpen, Sparkles } from "lucide-react";

interface EmptyJournalProps {
  onWrite: () => void;
  onLoadSamples: () => void;
}

export function EmptyJournal({ onWrite, onLoadSamples }: EmptyJournalProps) {
  return (
    <section className="empty-journal" aria-labelledby="empty-title">
      <Sparkles size={24} />
      <h2 id="empty-title">Your story starts here.</h2>
      <p>Every ordinary day becomes a memory once you write it down.</p>
      <div>
        <button className="primary-button" type="button" onClick={onWrite}>
          <BookOpen size={18} />
          Write your first memory
        </button>
        <button className="quiet-button" type="button" onClick={onLoadSamples}>
          See sample pages
        </button>
      </div>
    </section>
  );
}
