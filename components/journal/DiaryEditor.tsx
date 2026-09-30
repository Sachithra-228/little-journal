"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ExternalLink,
  LocateFixed,
  MapPin,
  Save,
  Tag
} from "lucide-react";
import { motion } from "framer-motion";
import { MoodSelector } from "@/components/journal/MoodSelector";
import { PhotoUploader } from "@/components/journal/PhotoUploader";
import { DatePicker } from "@/components/journal/DatePicker";
import { starterTags } from "@/lib/diary";
import { formatLongDate, formatWeekday } from "@/lib/utils";
import type {
  DiaryDraft,
  DiaryEntry,
  DiaryImage,
  DiaryLocationPoint,
  DiaryMood
} from "@/types/diary";

interface DiaryEditorProps {
  selectedDate: string;
  existingEntry: DiaryEntry | null;
  editingEntry: DiaryEntry | null;
  onDateChange: (date: string) => void;
  onSave: (draft: DiaryDraft) => void;
  onViewEntry: (entry: DiaryEntry) => void;
  onEditEntry: (entry: DiaryEntry) => void;
}

export function DiaryEditor({
  selectedDate,
  existingEntry,
  editingEntry,
  onDateChange,
  onSave,
  onViewEntry,
  onEditEntry
}: DiaryEditorProps) {
  const initial = editingEntry;
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [mood, setMood] = useState<DiaryMood>(initial?.mood ?? "Calm");
  const [location, setLocation] = useState(initial?.location ?? "");
  const [locationPoint, setLocationPoint] = useState<DiaryLocationPoint | undefined>(
    initial?.locationPoint
  );
  const [tags, setTags] = useState<string[]>(initial?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [images, setImages] = useState<DiaryImage[]>(initial?.images ?? []);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");

  const canSave = content.trim().length > 0 || title.trim().length > 0;
  const dateLabel = useMemo(() => formatLongDate(selectedDate), [selectedDate]);

  function addTag(tag: string) {
    const normalized = tag.trim();
    if (!normalized) {
      return;
    }
    setTags((current) =>
      current.includes(normalized) ? current : [...current, normalized].slice(0, 12)
    );
    setTagInput("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave || existingEntry) {
      return;
    }

    onSave({
      date: selectedDate,
      title,
      content,
      mood,
      location,
      locationPoint,
      tags,
      images
    });

    if (!editingEntry) {
      setTitle("");
      setContent("");
      setMood("Calm");
      setLocation("");
      setLocationPoint(undefined);
      setTags([]);
      setImages([]);
      setDetailsOpen(false);
    }
  }

  function useCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setLocationStatus("Location is not available in this browser.");
      return;
    }

    setLocationStatus("Finding your location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const point = {
          lat: Number(position.coords.latitude.toFixed(6)),
          lng: Number(position.coords.longitude.toFixed(6)),
          accuracy: Math.round(position.coords.accuracy)
        };
        setLocationPoint(point);
        setLocation(`${point.lat}, ${point.lng}`);
        setLocationStatus("Location added. You can rename it if you want.");
      },
      () => {
        setLocationStatus("Location permission was not allowed.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  }

  const mapHref = getMapHref(location, locationPoint);

  return (
    <motion.section
      className="diary-page"
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.55 }}
      aria-labelledby="editor-heading"
    >
      <div className="editor-date-row">
        <div>
          <p className="eyebrow">{editingEntry ? "Revisiting" : "Today's page"}</p>
          <h2 id="editor-heading">{dateLabel}</h2>
          <span>{formatWeekday(selectedDate)}</span>
        </div>
        <DatePicker value={selectedDate} onChange={onDateChange} />
      </div>

      {existingEntry ? (
        <div className="duplicate-note" role="status">
          <CalendarDays size={20} />
          <div>
            <strong>You already have a memory for this day.</strong>
            <p>Open it as a story, or edit the page you wrote earlier.</p>
          </div>
          <div className="duplicate-actions">
            <button type="button" className="quiet-button" onClick={() => onViewEntry(existingEntry)}>
              View entry
            </button>
            <button type="button" className="primary-button small" onClick={() => onEditEntry(existingEntry)}>
              Edit entry
            </button>
          </div>
        </div>
      ) : (
        <form className="editor-form" onSubmit={handleSubmit}>
          <label className="field-label" htmlFor="entry-title">
            How was your day?
          </label>
          <input
            id="entry-title"
            className="title-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="A short title"
          />

          <label className="sr-only" htmlFor="entry-content">
            Diary entry
          </label>
          <textarea
            id="entry-content"
            className="story-textarea"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            placeholder="Today I..."
            rows={10}
          />

          <section className="details-drawer">
            <button
              className="details-toggle"
              type="button"
              aria-expanded={detailsOpen}
              onClick={() => setDetailsOpen((value) => !value)}
            >
              <span>Add location, mood, tags, photos</span>
              <ChevronDown size={18} aria-hidden="true" />
            </button>

            {detailsOpen ? (
              <motion.div
                className="details-content"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.24 }}
              >
                <section className="location-panel" aria-labelledby="location-heading">
                  <div className="location-head">
                    <span id="location-heading">
                      <MapPin size={16} />
                      Location
                    </span>
                    <button className="quiet-button" type="button" onClick={useCurrentLocation}>
                      <LocateFixed size={16} />
                      Use current location
                    </button>
                  </div>
                  <label className="soft-field compact">
                    <span className="sr-only">Location name or place</span>
                    <input
                      value={location}
                      onChange={(event) => {
                        setLocation(event.target.value);
                        setLocationPoint(undefined);
                      }}
                      placeholder="Add a place or choose current location"
                    />
                  </label>
                  {locationStatus ? <p className="form-note">{locationStatus}</p> : null}
                  {location ? (
                    <div className="mini-map">
                      <iframe
                        title="Selected memory location map"
                        src={getMapEmbed(location, locationPoint)}
                        loading="lazy"
                        referrerPolicy="no-referrer-when-downgrade"
                      />
                      <a href={mapHref} target="_blank" rel="noreferrer">
                        <ExternalLink size={15} />
                        Open map
                      </a>
                    </div>
                  ) : null}
                </section>

                <MoodSelector value={mood} onChange={setMood} />

                <div className="tag-panel">
                  <span className="tag-title">
                    <Tag size={16} />
                    Tags
                  </span>
                  <div className="tag-options">
                    {starterTags.map((tag) => (
                      <button
                        className={tags.includes(tag) ? "tag-chip active" : "tag-chip"}
                        key={tag}
                        type="button"
                        onClick={() =>
                          tags.includes(tag)
                            ? setTags((current) => current.filter((item) => item !== tag))
                            : addTag(tag)
                        }
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                  <div className="tag-input-row">
                    <input
                      value={tagInput}
                      onChange={(event) => setTagInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addTag(tagInput);
                        }
                      }}
                      placeholder="Add your own tag"
                    />
                    <button type="button" className="quiet-button" onClick={() => addTag(tagInput)}>
                      Add
                    </button>
                  </div>
                  {tags.length ? (
                    <div className="selected-tags" aria-label="Selected tags">
                      {tags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setTags((current) => current.filter((item) => item !== tag))}
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                <PhotoUploader images={images} onChange={setImages} />
              </motion.div>
            ) : null}
          </section>

          <button className="save-button" type="submit" disabled={!canSave}>
            <Save size={18} />
            {editingEntry ? "Update this memory" : "Save this day"}
          </button>
        </form>
      )}
    </motion.section>
  );
}

function getMapHref(location: string, point?: DiaryLocationPoint) {
  const query = point ? `${point.lat},${point.lng}` : location;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function getMapEmbed(location: string, point?: DiaryLocationPoint) {
  const query = point ? `${point.lat},${point.lng}` : location;
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=14&output=embed`;
}
