"use client";

import { ChangeEvent, useRef, useState } from "react";
import { Camera, ImagePlus, X } from "lucide-react";
import NextImage from "next/image";
import { createId } from "@/lib/utils";
import type { DiaryImage } from "@/types/diary";

const MAX_IMAGE_EDGE = 1400;
const IMAGE_QUALITY = 0.72;

interface PhotoUploaderProps {
  images: DiaryImage[];
  onChange: (images: DiaryImage[]) => void;
}

export function PhotoUploader({ images, onChange }: PhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
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
        <div className="photo-actions">
          <button
            className="quiet-button"
            type="button"
            onClick={() => cameraInputRef.current?.click()}
          >
            <Camera size={17} />
            Take photo
          </button>
          <button
            className="quiet-button"
            type="button"
            onClick={() => inputRef.current?.click()}
          >
            <ImagePlus size={17} />
            Add photos
          </button>
        </div>
      </div>
      <input
        ref={cameraInputRef}
        className="sr-only"
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFiles}
      />
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
              <NextImage src={image.dataUrl} alt={image.alt} fill sizes="180px" unoptimized />
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

      compressImage(reader.result)
        .then((dataUrl) => {
          resolve({
            id: createId("image"),
            dataUrl,
            name: file.name,
            alt: `Memory photo named ${file.name}`
          });
        })
        .catch(reject);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function compressImage(dataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => {
      const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(image.width, image.height));
      const width = Math.max(1, Math.round(image.width * scale));
      const height = Math.max(1, Math.round(image.height * scale));
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");

      if (!context) {
        reject(new Error("Could not prepare photo"));
        return;
      }

      canvas.width = width;
      canvas.height = height;
      context.drawImage(image, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", IMAGE_QUALITY));
    };
    image.onerror = () => reject(new Error("Could not read photo"));
    image.src = dataUrl;
  });
}
