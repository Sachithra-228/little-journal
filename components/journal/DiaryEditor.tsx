"use client";

import { FormEvent, useMemo, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  ExternalLink,
  LocateFixed,
  MapPin,
  Save
} from "lucide-react";
import { motion } from "framer-motion";
import { PhotoUploader } from "@/components/journal/PhotoUploader";
import { DatePicker } from "@/components/journal/DatePicker";
import { DayTypeSwitch } from "@/components/journal/DayTypeSwitch";
import { HOME_LOCATION, ONSITE_LOCATION, getMapQuery } from "@/lib/diary";
import { getJournal, isWorkJournal, leaveReasons, type DayType } from "@/lib/journals";
import { formatLongDate, formatWeekday, toDateInputValue } from "@/lib/utils";
import type { DiaryDraft, DiaryEntry, DiaryImage, DiaryLocationPoint } from "@/types/diary";

interface DiaryEditorProps {
  journal: string;
  selectedDate: string;
  existingEntry: DiaryEntry | null;
  editingEntry: DiaryEntry | null;
  onDateChange: (date: string) => void;
  onSave: (draft: DiaryDraft) => void;
  onViewEntry: (entry: DiaryEntry) => void;
  onEditEntry: (entry: DiaryEntry) => void;
}

export function DiaryEditor({
  journal,
  selectedDate,
  existingEntry,
  editingEntry,
  onDateChange,
  onSave,
  onViewEntry,
  onEditEntry
}: DiaryEditorProps) {
  const initial = editingEntry;
  const isWork = isWorkJournal(journal);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [content, setContent] = useState(initial?.content ?? "");
  const [location, setLocation] = useState(initial?.location ?? (isWork ? ONSITE_LOCATION : ""));
  const [dayType, setDayType] = useState<DayType | null>(
    initial?.dayType ?? (isWork ? "onsite" : null)
  );
  const [leaveReason, setLeaveReason] = useState(initial?.leaveReason ?? "");
  const [locationPoint, setLocationPoint] = useState<DiaryLocationPoint | undefined>(
    initial?.locationPoint
  );
  const [images, setImages] = useState<DiaryImage[]>(initial?.images ?? []);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [locationStatus, setLocationStatus] = useState("");

  const onLeave = isWork && dayType === "leave";
  // A leave day needs no story; the reason is enough.
  const canSave = content.trim().length > 0 || title.trim().length > 0 || onLeave;
  const dateLabel = useMemo(() => formatLongDate(selectedDate), [selectedDate]);

  function chooseDayType(next: DayType) {
    setDayType(next);
    setLocation(next === "onsite" ? ONSITE_LOCATION : next === "remote" ? HOME_LOCATION : "");
    setLocationPoint(undefined);
    setLocationStatus("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSave || existingEntry) {
      return;
    }

    onSave({
      journal,
      dayType: isWork ? dayType ?? undefined : undefined,
      leaveReason: onLeave ? leaveReason || undefined : undefined,
      date: selectedDate,
      title: title.trim() || (onLeave ? `On leave${leaveReason ? ` · ${leaveReason}` : ""}` : title),
      content,
      // Mood and tags are no longer asked for; older pages keep what they had.
      mood: initial?.mood ?? "Normal",
      location: isWork ? location : "",
      locationPoint: isWork ? locationPoint : undefined,
      tags: initial?.tags ?? [],
      images
    });

    if (!editingEntry) {
      setTitle("");
      setContent("");
      setLocation(isWork ? ONSITE_LOCATION : "");
      setDayType(isWork ? "onsite" : null);
      setLeaveReason("");
      setLocationPoint(undefined);
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
          <p className="eyebrow">
            {getJournal(journal).name} ·{" "}
            {editingEntry
              ? "Revisiting"
              : selectedDate === toDateInputValue()
                ? "Today's page"
                : "Earlier page"}
          </p>
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
          {isWork ? (
            <div className="day-type-field">
              <span className="field-label">Where did you work today?</span>
              <DayTypeSwitch value={dayType} onChange={chooseDayType} />
              {onLeave ? (
                <div className="tag-options" role="group" aria-label="Leave reason">
                  {leaveReasons.map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      className={leaveReason === reason ? "tag-chip active" : "tag-chip"}
                      aria-pressed={leaveReason === reason}
                      onClick={() => setLeaveReason(leaveReason === reason ? "" : reason)}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          <label className="field-label" htmlFor="entry-title">
            How was your day?
          </label>
          <input
            id="entry-title"
            className="title-input"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder={onLeave ? "On leave (optional title)" : "A short title"}
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
              <span>{isWork ? "Add place and photos" : "Add photos"}</span>
              <ChevronDown size={18} aria-hidden="true" />
            </button>

            {detailsOpen ? (
              <motion.div
                className="details-content"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                transition={{ duration: 0.24 }}
              >
                {isWork ? (
                  <section className="location-panel" aria-labelledby="location-heading">
                    <div className="location-head">
                      <span id="location-heading">
                        <MapPin size={16} />
                        Place
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
                        placeholder="Somewhere else? Type a place"
                      />
                    </label>
                    {locationStatus ? <p className="form-note">{locationStatus}</p> : null}
                    {location && location !== HOME_LOCATION ? (
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
                ) : null}

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
  const query = getMapQuery(location, point);
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function getMapEmbed(location: string, point?: DiaryLocationPoint) {
  const query = getMapQuery(location, point);
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&z=14&output=embed`;
}
