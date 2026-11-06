"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, Moon, PenLine, Search, Sun, Unlock, X } from "lucide-react";
import { DiaryEditor } from "@/components/journal/DiaryEditor";
import { DiaryReader } from "@/components/journal/DiaryReader";
import { DiaryTimeline } from "@/components/journal/DiaryTimeline";
import { MemoryExplorer } from "@/components/journal/MemoryExplorer";
import { OwnerUnlock } from "@/components/journal/OwnerUnlock";
import {
  createEntry,
  deleteEntry,
  filterEntries,
  getEntryByDate,
  getMemoryStats,
  sortEntries,
  updateEntry
} from "@/lib/diary";
import { compressDiaryImages } from "@/lib/client-images";
import { getEntries, saveEntries } from "@/lib/storage";
import { deleteRemoteEntry, fetchRemoteEntries, saveRemoteEntry } from "@/lib/remote-storage";
import { formatLongDate, toDateInputValue } from "@/lib/utils";
import type { DiaryDraft, DiaryEntry, MemoryFilters } from "@/types/diary";


export function JournalApp() {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(toDateInputValue());
  const [editingEntry, setEditingEntry] = useState<DiaryEntry | null>(null);
  const [activeEntryId, setActiveEntryId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [showExplorer, setShowExplorer] = useState(false);
  const [showUnlock, setShowUnlock] = useState(false);
  const [showIntro, setShowIntro] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [notice, setNotice] = useState("");
  const [ownerPattern, setOwnerPattern] = useState("");
  const [filters, setFilters] = useState<MemoryFilters>({
    query: "",
    mood: "All",
    month: "",
    year: ""
  });

  // What to open once the owner pattern is entered (writing or editing a page).
  const pendingEditorRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const localEntries = sortEntries(getEntries());
    let cancelled = false;
    const introTimer = window.setTimeout(() => setShowIntro(false), 2350);

    setEntries(localEntries);
    setLoaded(true);
    setDarkMode(window.matchMedia("(prefers-color-scheme: dark)").matches);
    const savedOwnerPattern = window.sessionStorage.getItem("little-journal-owner-pattern") ?? "";
    setOwnerPattern(savedOwnerPattern);

    fetchRemoteEntries().then((result) => {
      if (cancelled) {
        return;
      }

      if (!result.ok) {
        return;
      }

      if (result.entries.length) {
        const remoteEntries = sortEntries(result.entries);
        setEntries(remoteEntries);
        saveEntries(remoteEntries);
        return;
      }

      if (localEntries.length && savedOwnerPattern) {
        uploadLocalEntries(localEntries, savedOwnerPattern);
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
  }, [entries, loaded]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (!notice) {
      return;
    }
    const timer = window.setTimeout(() => setNotice(""), 5200);
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
  const isOwner = Boolean(ownerPattern);

  // Anyone can browse; writing or editing asks for the owner pattern first.
  function openEditor(entry: DiaryEntry | null, date = toDateInputValue()) {
    const open = () => {
      setActiveEntryId(null);
      setEditingEntry(entry);
      setSelectedDate(entry?.date ?? date);
      setShowEditor(true);
    };

    if (isOwner) {
      open();
      return;
    }

    pendingEditorRef.current = open;
    setShowUnlock(true);
  }

  function handleUnlock(pattern: string) {
    window.sessionStorage.setItem("little-journal-owner-pattern", pattern);
    setOwnerPattern(pattern);
    setShowUnlock(false);
    setNotice("Owner tools unlocked.");
    pendingEditorRef.current?.();
    pendingEditorRef.current = null;
  }

  function handleLock() {
    window.sessionStorage.removeItem("little-journal-owner-pattern");
    setOwnerPattern("");
    setEditingEntry(null);
    setShowEditor(false);
    setNotice("Owner tools locked.");
  }

  async function syncEntry(entry: DiaryEntry, successMessage: string) {
    if (!ownerPattern) {
      setNotice("Unlock owner tools before saving changes.");
      return;
    }

    const result = await saveRemoteEntry(entry, ownerPattern);
    if (result.ok) {
      // The server copy links to its photos, which keeps browser storage small.
      setEntries((current) =>
        current.map((item) => (item.id === result.entry.id ? result.entry : item))
      );
      setNotice(successMessage);
      return;
    }

    setNotice(`Saved on this device. MongoDB sync failed: ${result.reason}`);
  }

  async function syncDelete(id: string, successMessage: string) {
    if (!ownerPattern) {
      setNotice("Unlock owner tools before saving changes.");
      return;
    }

    const result = await deleteRemoteEntry(id, ownerPattern);
    setNotice(
      result.ok ? successMessage : `Deleted on this device. MongoDB sync failed: ${result.reason}`
    );
  }

  async function handleSave(draft: DiaryDraft) {
    if (!isOwner) {
      setShowUnlock(true);
      return;
    }

    let compressedDraft: DiaryDraft;

    try {
      compressedDraft = {
        ...draft,
        images: await compressDiaryImages(draft.images)
      };
    } catch {
      setNotice("Could not prepare the photo. Try removing it and adding it again.");
      return;
    }

    if (editingEntry) {
      const updated = updateEntry(editingEntry, compressedDraft);
      const nextEntries = sortEntries(
        entries.map((entry) => (entry.id === updated.id ? updated : entry))
      );
      setEntries(nextEntries);
      saveEntries(nextEntries);
      setEditingEntry(null);
      setActiveEntryId(null);
      setShowEditor(false);
      setNotice("Updated your diary. Syncing...");
      syncEntry(updated, "Updated and saved to your diary.");
      return;
    }

    const entry = createEntry(compressedDraft);
    const nextEntries = sortEntries([entry, ...entries]);
    setEntries(nextEntries);
    saveEntries(nextEntries);
    setShowEditor(false);
    setActiveEntryId(entry.id);
    setNotice("Saved it to your diary. Syncing...");
    syncEntry(entry, "Saved it to your diary.");
  }

  function handleDelete(id: string) {
    if (!isOwner) {
      setShowUnlock(true);
      return;
    }

    const nextEntries = deleteEntry(entries, id);
    setEntries(nextEntries);
    saveEntries(nextEntries);
    setActiveEntryId(null);
    setEditingEntry(null);
    setNotice("Memory deleted. Syncing...");
    syncDelete(id, "Memory deleted from your diary.");
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
        <dl className="nav-stats" aria-label="Journal reflections">
          <div>
            <dt>memories</dt>
            <dd>{stats.memories}</dd>
          </div>
          <div>
            <dt>months</dt>
            <dd>{stats.months}</dd>
          </div>
          <div>
            <dt>places</dt>
            <dd>{stats.places}</dd>
          </div>
        </dl>
        <div className="nav-actions">
          <button
            className="icon-button"
            type="button"
            aria-label={isOwner ? "Lock owner tools" : "Unlock owner tools"}
            title={isOwner ? "Lock owner tools" : "Unlock owner tools"}
            onClick={isOwner ? handleLock : () => setShowUnlock(true)}
          >
            {isOwner ? <Unlock size={18} /> : <Lock size={18} />}
          </button>
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

      <section id="top" className="hero-section">
        <DiaryTimeline
          entries={visibleEntries}
          totalEntries={entries.length}
          onOpen={(entry) => setActiveEntryId(entry.id)}
          onEdit={(entry) => openEditor(entry)}
          onWrite={(date) => openEditor(null, date)}
          lead={
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
              <button className="primary-button" type="button" onClick={() => openEditor(null)}>
                <PenLine size={18} />
                Start writing
              </button>
            </motion.div>
          }
        />
      </section>

      <AnimatePresence>
        {showEditor ? (
          <motion.div
            className="reader-backdrop editor-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="editor-heading"
          >
            <motion.div
              className="editor-dialog quick-editor-frame"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.3 }}
            >
              <button
                className="reader-close"
                type="button"
                aria-label="Close editor"
                onClick={() => {
                  setShowEditor(false);
                  setEditingEntry(null);
                }}
              >
                <X size={20} />
              </button>
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
                onViewEntry={(entry) => {
                  setShowEditor(false);
                  setActiveEntryId(entry.id);
                }}
                onEditEntry={(entry) => {
                  setEditingEntry(entry);
                  setSelectedDate(entry.date);
                }}
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

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

      <AnimatePresence>
        {showUnlock ? (
          <OwnerUnlock
            onClose={() => {
              setShowUnlock(false);
              pendingEditorRef.current = null;
            }}
            onUnlock={handleUnlock}
          />
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {activeEntry ? (
          <DiaryReader
            entry={activeEntry}
            entries={entries}
            onClose={() => setActiveEntryId(null)}
            onEdit={(entry) => openEditor(entry)}
            onDelete={handleDelete}
            onNavigate={(entry) => setActiveEntryId(entry.id)}
            canManage={isOwner}
          />
        ) : null}
      </AnimatePresence>

      <footer className="journal-footer">
        <span>Every ordinary day becomes a memory once you write it down.</span>
      </footer>
    </main>
  );
}

async function uploadLocalEntries(entries: DiaryEntry[], ownerPattern: string) {
  // One memory per request keeps each upload well under the server's size limit.
  for (const entry of entries) {
    await saveRemoteEntry(entry, ownerPattern);
  }
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
