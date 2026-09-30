"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Moon, PenLine, Search, Sun } from "lucide-react";
import { DiaryEditor } from "@/components/journal/DiaryEditor";
import { DiaryReader } from "@/components/journal/DiaryReader";
import { DiaryTimeline } from "@/components/journal/DiaryTimeline";
import { EmptyJournal } from "@/components/journal/EmptyJournal";
import { MemoryExplorer } from "@/components/journal/MemoryExplorer";
import {
  createEntry,
  deleteEntry,
  filterEntries,
  getEntryByDate,
  getMemoryStats,
  sortEntries,
  updateEntry
} from "@/lib/diary";
import { getEntries, saveEntries } from "@/lib/storage";
import { fetchRemoteEntries, saveRemoteEntries } from "@/lib/remote-storage";
import { formatLongDate, toDateInputValue } from "@/lib/utils";
import type { DiaryDraft, DiaryEntry, MemoryFilters } from "@/types/diary";

const sampleEntries: DiaryEntry[] = [
  {
    id: "sample-1",
    date: "2026-09-30",
    title: "A New Beginning",
    content:
      "The morning felt unusually gentle. I made tea, opened the window, and let the day arrive slowly. There was a small kind of courage in doing ordinary things with attention.",
    mood: "Grateful",
    location: "Colombo",
    tags: ["Personal", "Growth"],
    images: [],
    createdAt: "2026-09-30T08:00:00.000Z",
    updatedAt: "2026-09-30T08:00:00.000Z"
  },
  {
    id: "sample-2",
    date: "2026-09-29",
    title: "Getting Ready",
    content:
      "I spent the evening arranging tomorrow in small ways: folded clothes, charged devices, a quiet list on paper. Preparation can feel like care when it is done softly.",
    mood: "Calm",
    location: "Home",
    tags: ["Quiet", "Work"],
    images: [],
    createdAt: "2026-09-29T18:20:00.000Z",
    updatedAt: "2026-09-29T18:20:00.000Z"
  },
  {
    id: "sample-3",
    date: "2026-09-27",
    title: "An Unexpected Evening",
    content:
      "A short walk became a long conversation. The sky turned dusty blue above the streetlights, and for a while everything felt unhurried and possible.",
    mood: "Happy",
    location: "By the lake",
    tags: ["Friends", "Travel"],
    images: [],
    createdAt: "2026-09-27T19:40:00.000Z",
    updatedAt: "2026-09-27T19:40:00.000Z"
  }
];

export function JournalApp() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(toDateInputValue());
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showExplorer, setShowExplorer] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [notice, setNotice] = useState("");
  const [filters, setFilters] = useState<MemoryFilters>({
    query: "",
    mood: "All",
    month: "",
    year: ""
  });

  const editorRef = useRef<HTMLDivElement>(null);
  const storyRef = useRef<HTMLDivElement>(null);
  const remoteReadyRef = useRef(false);

  useEffect(() => {
    const localEntries = sortEntries(getEntries());
    let cancelled = false;
    const introTimer = window.setTimeout(() => setShowIntro(false), 2350);

    setEntries(localEntries);
    setLoaded(true);
    setDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);

    fetchRemoteEntries().then((result) => {
      if (cancelled) {
        return;
      }

      if (!result.ok) {
        return;
      }

      remoteReadyRef.current = true;

      if (result.entries.length) {
        const remoteEntries = sortEntries(result.entries);
        setEntries(remoteEntries);
        saveEntries(remoteEntries);
        return;
      }

      if (localEntries.length) {
        saveRemoteEntries(localEntries);
      }
    });

    return () => {
      cancelled = true;
      window.clearTimeout(introTimer);
    };
  }, []);

  useEffect(() => {
    if (loaded) {
      saveEntries(entries);
    }

    if (!loaded || !remoteReadyRef.current) {
      return;
    }

    const syncTimer = window.setTimeout(() => {
      saveRemoteEntries(entries);
    }, 650);

    return () => window.clearTimeout(syncTimer);
  }, [entries, loaded]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timer = window.setTimeout(() => setNotice(""), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const existingForDate = useMemo(
    () => getEntryByDate(entries, selectedDate),
    [entries, selectedDate]
  );
  const activeEntry = useMemo(
    () => entries.find((entry) => entry.id === activeEntryId) ?? null,
    [activeEntryId, entries]
  );
  const visibleEntries = useMemo(
    () => filterEntries(entries, filters),
    [entries, filters]
  );
  const stats = useMemo(() => getMemoryStats(entries), [entries]);

  function scrollToEditor() {
    editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function handleSave(draft: DiaryDraft) {
    if (editingEntry) {
      const updated = updateEntry(editingEntry, draft);
      setEntries((current) =>
        sortEntries(current.map((entry) => (entry.id === updated.id ? updated : entry)))
      );
      setEditingEntry(null);
      setActiveEntryId(updated.id);
      setNotice("Memory updated.");
      return;
    }

    const entry = createEntry(draft);
    setEntries((current) => sortEntries([entry, ...current]));
    setActiveEntryId(entry.id);
    setNotice("Saved to your story.");
    window.setTimeout(() => {
      storyRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 120);
  }

  function handleDelete(id: string) {
    setEntries((current) => deleteEntry(current, id));
    setActiveEntryId(null);
    setEditingEntry(null);
    setNotice("Memory deleted.");
  }

  function loadSamples() {
    setEntries(sortEntries(sampleEntries));
    setNotice("Sample memories added.");
  }

  const todayLabel = formatLongDate(toDateInputValue());

  return (
    <main className="min-h-screen bg-paper text-ink transition-colors duration-500">
      <div className="paper-grain" aria-hidden="true" />
      <AnimatePresence>{showIntro ? <IntroOverlay todayLabel={todayLabel} /> : null}</AnimatePresence>
      <nav className="journal-nav" aria-label="Primary">
        <a href="#top" className="brand-mark">
          Little Journal
        </a>
        <div className="nav-actions">
          <button
            className="icon-button"
            type="button"
            aria-label="Explore memories"
            title="Explore memories"
            onClick={() => setShowExplorer((value) => !value)}
          >
            <Search size={18} />
          </button>
          <button
            className="icon-button"
            type="button"
            aria-label={darkMode ? "Use daytime theme" : "Use late-night theme"}
            title={darkMode ? "Daytime theme" : "Late-night theme"}
            onClick={() => setDarkMode((value) => !value)}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </nav>

      <section id="top" className="hero-section">
        <div className="opening-layout">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut", delay: 0.15 }}
            className="hero-inner"
          >
            <p className="eyebrow">Private daily pages</p>
            <h1>Little Journal</h1>
            <p className="hero-line">Small moments. Big memories.</p>
            <div className="today-block" aria-label={`Today is ${todayLabel}`}>
              <span>{new Intl.DateTimeFormat("en", { weekday: "long" }).format(new Date())}</span>
              <strong>
                {new Intl.DateTimeFormat("en", {
                  month: "long",
                  day: "numeric",
                  year: "numeric"
                }).format(new Date())}
              </strong>
            </div>
            <p className="hero-question">What happened today?</p>
            <button className="primary-button" type="button" onClick={scrollToEditor}>
              <PenLine size={18} />
              Start writing
            </button>
          </motion.div>

          <div ref={editorRef} className="quick-editor-frame">
            <DiaryEditor
              key={editingEntry?.id ?? selectedDate}
              selectedDate={selectedDate}
              existingEntry={editingEntry ? null : existingForDate}
              editingEntry={editingEntry}
              onDateChange={(date) => {
                setSelectedDate(date);
                setEditingEntry(null);
              }}
              onSave={handleSave}
              onViewEntry={(entry) => setActiveEntryId(entry.id)}
              onEditEntry={(entry) => {
                setEditingEntry(entry);
                setSelectedDate(entry.date);
              }}
            />
          </div>
        </div>
      </section>

      <AnimatePresence>
        {notice ? (
          <motion.div
            className="toast"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            role="status"
          >
            {notice}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <section className="reflection-strip" aria-label="Journal reflections">
        <div>
          <strong>{stats.memories}</strong>
          <span>memories collected</span>
        </div>
        <div>
          <strong>{stats.months}</strong>
          <span>months documented</span>
        </div>
        <div>
          <strong>{stats.places}</strong>
          <span>places remembered</span>
        </div>
      </section>

      <AnimatePresence>
        {showExplorer ? (
          <MemoryExplorer
            entries={entries}
            filters={filters}
            onChange={setFilters}
            onClose={() => setShowExplorer(false)}
          />
        ) : null}
      </AnimatePresence>

      <div ref={storyRef} className="section-shell story-shell">
        {entries.length === 0 ? (
          <EmptyJournal onWrite={scrollToEditor} onLoadSamples={loadSamples} />
        ) : (
          <DiaryTimeline
            entries={visibleEntries}
            totalEntries={entries.length}
            onOpen={(entry) => setActiveEntryId(entry.id)}
          />
        )}
      </div>

      <AnimatePresence>
        {activeEntry ? (
          <DiaryReader
            entry={activeEntry}
            entries={entries}
            onClose={() => setActiveEntryId(null)}
            onEdit={(entry) => {
              setActiveEntryId(null);
              setEditingEntry(entry);
              setSelectedDate(entry.date);
              window.setTimeout(scrollToEditor, 80);
            }}
            onDelete={handleDelete}
            onNavigate={(entry) => setActiveEntryId(entry.id)}
          />
        ) : null}
      </AnimatePresence>

      <footer className="journal-footer">
        <span>Every ordinary day becomes a memory once you write it down.</span>
      </footer>
    </main>
  );
}

function IntroOverlay({ todayLabel }: { todayLabel: string }) {
  const lines = ["Little Journal", "Small moments. Big memories.", todayLabel];

  return (
    <motion.div
      className="intro-overlay"
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, y: -18 }}
      transition={{ duration: 0.45, ease: "easeInOut" }}
      aria-hidden="true"
    >
      <div>
        {lines.map((line, index) => (
          <motion.span
            key={line}
            className={index === 0 ? "intro-title" : "intro-line"}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: index * 0.34, ease: "easeOut" }}
          >
            {line}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
}
