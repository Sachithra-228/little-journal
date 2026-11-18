import { notFound, permanentRedirect } from "next/navigation";
import { DEFAULT_JOURNAL } from "@/lib/journals";

// Links shared before separate diaries were /memory/<date>; they were all Sandbox pages.
export default async function LegacyMemoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(slug)) {
    notFound();
  }

  permanentRedirect(`/memory/${DEFAULT_JOURNAL}/${slug}`);
}
