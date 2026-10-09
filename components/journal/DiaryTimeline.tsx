"use client";

import { useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight, MapPin, X } from "lucide-react";
import Image from "next/image";
import { cn, formatLongDate, monthKey, parseLocalDate, toDateInputValue } from "@/lib/utils";
import type { DiaryEntry } from "@/types/diary";

interface DiaryTimelineProps {
  entries: DiaryEntry[];
  totalEntries: number;
  onOpen: (entry: DiaryEntry) => void;
}

const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function DiaryTimeline({ entries, totalEntries, onOpen }: DiaryTimelineProps) {
  const today = toDateInputValue();
  const [viewMonth, setViewMonth] = useState(() => monthKey(entries[0]?.date ?? today));
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const storyRef = useRef<HTMLElement>(null);

  const entriesByDate = useMemo(
    () => new Map(entries.map((entry) => [entry.date, entry])),
    [entries]
  );
  const { leadingBlanks, days } = useMemo(() => buildMonth(viewMonth), [viewMonth]);
  const selectedEntry = selectedDate ? entriesByDate.get(selectedDate) ?? null : null;
  const monthCount = days.filter((day) => entriesByDate.has(day)).length;

  if (entries.length === 0) {
    return (
      <section className="timeline-empty">
        <p>No memory matches this search.</p>
        <span>Try a softer word, a different mood, or another month.</span>
      </section>
    );
  }

  function selectDate(date: string) {
    if (date === selectedDate) {
      setSelectedDate(null);
      return;
    }

    setSelectedDate(date);

    if (window.matchMedia("(max-width: 820px)").matches) {
      window.setTimeout(() => {
        storyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
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

      <div className="calendar-stage">
        <motion.div
          layout="position"
          className="memory-calendar"
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="calendar-head">
            <button
              className="icon-button"
              type="button"
              aria-label="Previous month"
              onClick={() => setViewMonth(shiftMonth(viewMonth, -1))}
            >
              <ChevronLeft size={17} />
            </button>
            <h3 aria-live="polite">{formatMonth(viewMonth)}</h3>
            <button
              className="icon-button"
              type="button"
              aria-label="Next month"
              onClick={() => setViewMonth(shiftMonth(viewMonth, 1))}
            >
              <ChevronRight size={17} />
            </button>
          </div>

          <div className="calendar-weekdays" aria-hidden="true">
            {weekdays.map((weekday) => (
              <span key={weekday}>{weekday}</span>
            ))}
          </div>

          <div className="calendar-grid">
            {Array.from({ length: leadingBlanks }, (_, index) => (
              <span key={`blank-${index}`} />
            ))}
            {days.map((day) => {
              const entry = entriesByDate.get(day);

              return (
                <button
                  key={day}
                  type="button"
                  className={cn(
                    "calendar-day",
                    entry && "has-memory",
                    day === today && "today",
                    day === selectedDate && "selected"
                  )}
                  disabled={!entry}
                  aria-pressed={entry ? day === selectedDate : undefined}
                  aria-label={
                    entry ? `${formatLongDate(day)}: ${entry.title}` : formatLongDate(day)
                  }
                  title={entry?.title}
                  onClick={() => selectDate(day)}
                >
                  {Number(day.slice(8))}
                </button>
              );
            })}
          </div>

          <div className="calendar-foot">
            <span>
              {monthCount === 0
                ? "No memories this month"
                : `${monthCount} ${monthCount === 1 ? "memory" : "memories"} this month`}
            </span>
            {monthCount === 0 ? (
              <button type="button" onClick={() => setViewMonth(monthKey(entries[0].date))}>
                Latest memory
              </button>
            ) : null}
          </div>
        </motion.div>

        <AnimatePresence mode="popLayout">
          {selectedEntry ? (
            <motion.article
              key={selectedEntry.id}
              ref={storyRef}
              className="calendar-story"
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 24 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <button
                className="reader-close"
                type="button"
                aria-label="Close memory"
                onClick={() => setSelectedDate(null)}
              >
                <X size={20} />
              </button>

              <time dateTime={selectedEntry.date}>{formatLongDate(selectedEntry.date)}</time>
              <h3>{selectedEntry.title}</h3>
              <div className="entry-meta">
                <span>{selectedEntry.mood}</span>
                {selectedEntry.location ? (
                  <span>
                    <MapPin size={14} />
                    {selectedEntry.location}
                  </span>
                ) : null}
                {selectedEntry.tags.slice(0, 3).map((tag) => (
                  <span key={tag}>{tag}</span>
                ))}
              </div>

              {selectedEntry.images[0] ? (
                <div className="reader-cover">
                  <Image
                    src={selectedEntry.images[0].dataUrl}
                    alt={selectedEntry.images[0].alt}
                    fill
                    sizes="(min-width: 820px) 560px, 100vw"
                    unoptimized
                  />
                </div>
              ) : null}

              <div className="calendar-story-text">
                {selectedEntry.content.split(/\n{2,}/).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>

              <button
                className="primary-button small"
                type="button"
                onClick={() => onOpen(selectedEntry)}
              >
                <BookOpen size={16} />
                Open full page
              </button>
            </motion.article>
          ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}

function buildMonth(month: string) {
  const [year, monthNumber] = month.split("-").map(Number);
  const firstWeekday = new Date(year, monthNumber - 1, 1).getDay();
  const dayCount = new Date(year, monthNumber, 0).getDate();

  return {
    leadingBlanks: (firstWeekday + 6) % 7,
    days: Array.from(
      { length: dayCount },
      (_, index) => `${month}-${String(index + 1).padStart(2, "0")}`
    )
  };
}

function shiftMonth(month: string, delta: number) {
  const [year, monthNumber] = month.split("-").map(Number);
  return toDateInputValue(new Date(year, monthNumber - 1 + delta, 1)).slice(0, 7);
}

function formatMonth(month: string) {
  return new Intl.DateTimeFormat("en", { month: "long", year: "numeric" }).format(
    parseLocalDate(`${month}-01`)
  );
}
