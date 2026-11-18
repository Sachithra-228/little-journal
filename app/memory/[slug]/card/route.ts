import { DEFAULT_JOURNAL } from "@/lib/journals";

// Preview cards for links shared before separate diaries (/memory/<date>/card).
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return Response.redirect(new URL(`/memory/${DEFAULT_JOURNAL}/${slug}/card`, request.url), 308);
}
