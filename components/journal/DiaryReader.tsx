"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MapPin,
  Pencil,
  Trash2,
  X
} from "lucide-react";
import Image from "next/image";
import { sortEntries } from "@/lib/diary";
import { formatLongDate, formatWeekday } from "@/lib/utils";
import type { DiaryEntry } from "@/types/diary";

interface DiaryReaderProps {
  entry: DiaryEntry;
  entries: DiaryEntry[];
  onClose: () => void;
  onEdit: (entry: DiaryEntry) => void;
  onDelete: (id: string) => void;
  onNavigate: (entry: DiaryEntry) => void;
}

export function DiaryReader({
  entry,
  entries,
  onClose,
  onEdit,
  onDelete,
  onNavigate
}: DiaryReaderProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const orderedEntries = useMemo(() => sortEntries(entries), [entries]);
  const currentIndex = orderedEntries.findIndex((item) => item.id === entry.id);
  const previous = orderedEntries[currentIndex + 1] ?? null;
  const next = orderedEntries[currentIndex - 1] ?? null;

  return (
    <motion.div
      className="reader-backdrop"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="reader-title"
    >
      <motion.article
        className="reader-page"
        initial={{ opacity: 0, y: 30, scale: 0.985 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.985 }}
        transition={{ duration: 0.35 }}
      >
        <button className="reader-close" type="button" aria-label="Close reader" onClick={onClose}>
          <X size={20} />
        </button>

        <header className="reader-header">
          <time dateTime={entry.date}>{formatLongDate(entry.date)}</time>
          <span>{formatWeekday(entry.date)}</span>
          <h2 id="reader-title">{entry.title}</h2>
          <div className="reader-meta">
            <span>{entry.mood}</span>
            {entry.location ? (
              <a href={getMapHref(entry)} target="_blank" rel="noreferrer">
                <MapPin size={15} />
                {entry.location}
                <ExternalLink size={14} />
              </a>
            ) : null}
          </div>
        </header>

        {entry.images.length ? (
          <div className="reader-gallery">
            {entry.images.map((image) => (
              <div key={image.id}>
                <Image src={image.dataUrl} alt={image.alt} fill sizes="280px" unoptimized />
              </div>
            ))}
          </div>
        ) : null}

        <div className="reader-story">
          {entry.content.split(/\n{2,}/).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>

        {entry.tags.length ? (
          <div className="reader-tags">
            {entry.tags.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        ) : null}

        <footer className="reader-footer">
          <div className="reader-stepper">
            <button type="button" disabled={!previous} onClick={() => previous && onNavigate(previous)}>
              <ChevronLeft size={17} />
              Previous memory
            </button>
            <button type="button" disabled={!next} onClick={() => next && onNavigate(next)}>
              Next memory
              <ChevronRight size={17} />
            </button>
          </div>
          <div className="reader-actions">
            <button type="button" onClick={() => onEdit(entry)}>
              <Pencil size={16} />
              Edit
            </button>
            <button type="button" onClick={() => setConfirmingDelete(true)}>
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </footer>

        {confirmingDelete ? (
          <div className="confirm-delete" role="alertdialog" aria-labelledby="delete-title">
            <div>
              <h3 id="delete-title">Delete this memory?</h3>
              <p>This story will be removed from this browser.</p>
            </div>
            <div>
              <button type="button" className="quiet-button" onClick={() => setConfirmingDelete(false)}>
                Cancel
              </button>
              <button type="button" className="danger-button" onClick={() => onDelete(entry.id)}>
                Delete memory
              </button>
            </div>
          </div>
        ) : null}
      </motion.article>
    </motion.div>
  );
}

function getMapHref(entry: DiaryEntry) {
  const query = entry.locationPoint
    ? `${entry.locationPoint.lat},${entry.locationPoint.lng}`
    : entry.location;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}
