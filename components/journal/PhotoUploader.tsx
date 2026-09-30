"use client";

import { ChangeEvent, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { createId } from "@/lib/utils";
import type { DiaryImage } from "@/types/diary";

interface PhotoUploaderProps {
  images: DiaryImage[];
  onChange: (images: DiaryImage[]) => void;
}

export function PhotoUploader({ images, onChange }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, 6);
    setError("");

    try {
      const nextImages = await Promise.all(files.map(fileToDiaryImage));
      onChange([...images, ...nextImages].slice(0, 8));
    } catch {
      setError("One photo could not be added.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <section className="photo-panel" aria-labelledby="photos-heading">
      <div className="photo-panel-head">
        <div>
          <span id="photos-heading">Photos</span>
          <p>Add small memory fragments from the day.</p>
        </div>
        <button
          className="quiet-button"
          type="button"
          onClick={() => inputRef.current?.click()}
        >
          <ImagePlus size={17} />
          Add a memory
        </button>
      </div>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="image/*"
        multiple
        onChange={handleFiles}
      />
      {error ? <p className="form-error">{error}</p> : null}
      {images.length ? (
        <div className="photo-grid">
          {images.map((image) => (
            <figure key={image.id}>
              <Image src={image.dataUrl} alt={image.alt} fill sizes="180px" unoptimized />
              <button
                type="button"
                aria-label={`Remove ${image.name}`}
                onClick={() => onChange(images.filter((item) => item.id !== image.id))}
              >
                <X size={15} />
              </button>
            </figure>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function fileToDiaryImage(file: File): Promise<DiaryImage> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Unsupported file"));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        reject(new Error("Missing image data"));
        return;
      }
      resolve({
        id: createId("image"),
        dataUrl: reader.result,
        name: file.name,
        alt: `Memory photo named ${file.name}`
      });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
