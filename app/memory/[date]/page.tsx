import type { Metadata, Viewport } from "next";
import { headers } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { ShareMemory } from "@/components/journal/ShareMemory";
import { getSharedEntry, shareExcerpt } from "@/lib/shared-entry";
import { formatLongDate } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// One fixed paper theme: phone and in-app browsers mixed dark text into light backgrounds.
export const viewport: Viewport = {
  colorScheme: "only light",
  themeColor: "#f8f4eb"
};

interface MemoryPageProps {
  params: Promise<{ date: string }>;
}

export async function generateMetadata({ params }: MemoryPageProps): Promise<Metadata> {
  const { date } = await params;
  const entry = await getSharedEntry(date);

  if (!entry) {
    return { title: "Memory not found — Little Journal" };
  }

  const baseUrl = await getBaseUrl();
  const description = shareExcerpt(entry.content);
  const image = `${baseUrl}/memory/${entry.date}/card`;

  return {
    title: `${entry.title} — Little Journal`,
    description,
    openGraph: {
      type: "article",
      siteName: "Little Journal",
      title: entry.title,
      description,
      url: `${baseUrl}/memory/${entry.date}`,
      images: [{ url: image, width: 1200, height: 630, alt: entry.title }]
    },
    twitter: {
      card: "summary_large_image",
      title: entry.title,
      description,
      images: [image]
    }
  };
}

export default async function MemoryPage({ params }: MemoryPageProps) {
  const { date } = await params;
  const entry = await getSharedEntry(date);

  if (!entry) {
    notFound();
  }

  const [coverImage, ...extraImages] = entry.images;

  return (
    <main className="shared-memory">
      <nav className="journal-nav" aria-label="Primary">
        <Link href="/" className="brand-mark">
          Little Journal
        </Link>
      </nav>

      <article className="reader-page shared-memory-page">
        <section className="reader-hero">
          <header className="reader-header">
            <time dateTime={entry.date}>{formatLongDate(entry.date)}</time>
            <h1>{entry.title}</h1>
            <div className="reader-meta">
              <span>{entry.mood}</span>
              {entry.location ? (
                <span>
                  <MapPin size={15} />
                  {entry.location}
                </span>
              ) : null}
            </div>
          </header>

          {coverImage ? (
            <div className="reader-cover">
              <Image src={coverImage.dataUrl} alt={coverImage.alt} fill sizes="(min-width: 900px) 860px, 100vw" unoptimized />
            </div>
          ) : null}
        </section>

        {extraImages.length ? (
          <div className="reader-gallery">
            {extraImages.map((image) => (
              <div key={image.id}>
                <Image src={image.dataUrl} alt={image.alt} fill sizes="280px" unoptimized />
              </div>
            ))}
          </div>
        ) : null}

        <div className="reader-story">
          {entry.content.split(/\n{2,}/).map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
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
          <ShareMemory entry={entry} buttonClassName="primary-button small" align="end" />
        </footer>
      </article>
    </main>
  );
}

async function getBaseUrl() {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host") ?? "localhost:3000";
  const protocol =
    requestHeaders.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${protocol}://${host}`;
}
