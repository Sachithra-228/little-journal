"use client";

import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import { formatTimelineDate, formatWeekday } from "@/lib/utils";
import type { DiaryEntry } from "@/types/diary";

interface DiaryTimelineProps {
  entries: DiaryEntry[];
  totalEntries: number;
  onOpen: (entry: DiaryEntry) => void;
}

export function DiaryTimeline({ entries, totalEntries, onOpen }: DiaryTimelineProps) {
  if (entries.length === 0) {
    return (
      <section className="timeline-empty">
        <p>No memory matches this search.</p>
        <span>Try a softer word, a different mood, or another month.</span>
      </section>
    );
  }

  return (
    <section className="timeline" aria-labelledby="story-heading">
      <div className="section-heading">
        <p className="eyebrow">Saved diary story</p>
        <h2 id="story-heading">Your days, becoming chapters.</h2>
        <span>
          Showing {entries.length} of {totalEntries} memories
        </span>
      </div>

      <div className="timeline-list">
        {entries.map((entry, index) => {
          return (
            <motion.article
              key={entry.id}
              className="timeline-entry"
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.45, delay: Math.min(index * 0.04, 0.22) }}
            >
              <button type="button" onClick={() => onOpen(entry)}>
                <time dateTime={entry.date}>
                  <strong>{formatTimelineDate(entry.date)}</strong>
                  <span>{formatWeekday(entry.date)}</span>
                </time>
                <div className="timeline-copy">
                  <h3>{entry.title}</h3>
                  <p>{entry.content}</p>
                  <div className="entry-meta">
                    <span>{entry.mood}</span>
                    {entry.location ? (
                      <span>
                        <MapPin size={14} />
                        {entry.location}
                      </span>
                    ) : null}
                    {entry.tags.slice(0, 3).map((tag) => (
                      <span key={tag}>{tag}</span>
                    ))}
                  </div>
                </div>
              </button>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}
