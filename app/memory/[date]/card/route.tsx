import { ImageResponse } from "next/og";
import { getSharedEntry, shareExcerpt } from "@/lib/shared-entry";
import { formatLongDate, parseLocalDate } from "@/lib/utils";

export const runtime = "nodejs";

const colors = {
  paper: "rgb(248, 244, 235)",
  surface: "rgb(255, 252, 245)",
  ink: "rgb(43, 38, 32)",
  muted: "rgb(118, 106, 92)",
  accent: "rgb(139, 93, 67)",
  line: "rgb(221, 211, 196)"
};

export async function GET(_request: Request, { params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const entry = await getSharedEntry(date);

  if (!entry) {
    return new Response("Memory not found.", { status: 404 });
  }

  const title = entry.title.length > 90 ? `${entry.title.slice(0, 88).trim()}…` : entry.title;
  const longTitle = title.length > 48;
  const excerpt = shareExcerpt(entry.content, longTitle ? 105 : entry.images[0] ? 140 : 190);
  const dateLabel = formatLongDate(entry.date);
  const day = parseLocalDate(entry.date);
  const dayNumber = String(day.getDate());
  const monthLabel = new Intl.DateTimeFormat("en", { month: "long" }).format(day).toUpperCase();
  const details = [entry.mood, entry.location].filter(Boolean).join("  ·  ");
  const cover = entry.images[0]?.dataUrl;

  const fontText = `${title}${excerpt}${dateLabel}${details}${dayNumber}${monthLabel}Little Journal`;
  const [serifBold, serifRegular] = await Promise.all([
    loadGoogleFont("Cormorant Garamond", 600, fontText),
    loadGoogleFont("Cormorant Garamond", 500, fontText)
  ]);
  const fonts = [
    serifBold && { name: "Cormorant", data: serifBold, weight: 600 as const, style: "normal" as const },
    serifRegular && { name: "Cormorant", data: serifRegular, weight: 500 as const, style: "normal" as const }
  ].filter((font) => font !== null);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          padding: 48,
          background: colors.paper
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            gap: 44,
            border: `1px solid ${colors.line}`,
            borderRadius: 14,
            padding: 44,
            background: colors.surface
          }}
        >
          <div
            style={{
              display: "flex",
              flex: 1,
              flexDirection: "column",
              justifyContent: "space-between",
              minWidth: 0
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div
                style={{
                  display: "flex",
                  color: colors.accent,
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: 4
                }}
              >
                LITTLE JOURNAL
              </div>
              <div style={{ display: "flex", color: colors.muted, fontFamily: "Cormorant", fontSize: 30, fontWeight: 500 }}>
                {dateLabel}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              <div
                style={{
                  display: "flex",
                  color: colors.ink,
                  fontFamily: "Cormorant",
                  fontSize: longTitle ? 54 : cover ? 60 : 66,
                  fontWeight: 600,
                  lineHeight: 1.04
                }}
              >
                {title}
              </div>
              <div
                style={{
                  display: "flex",
                  color: colors.muted,
                  fontFamily: "Cormorant",
                  fontSize: 28,
                  fontWeight: 500,
                  lineHeight: 1.35
                }}
              >
                {excerpt}
              </div>
            </div>

            <div
              style={{
                display: "flex",
                borderTop: `1px solid ${colors.line}`,
                paddingTop: 18,
                color: colors.muted,
                fontSize: 20
              }}
            >
              {details || "A page from my diary"}
            </div>
          </div>

          {cover ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={cover}
              alt=""
              width={400}
              height={446}
              style={{ width: 400, height: 446, borderRadius: 10, objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                width: 260,
                borderRadius: 10,
                background: "rgba(139, 93, 67, 0.1)",
                border: "1px solid rgba(139, 93, 67, 0.28)"
              }}
            >
              <div style={{ display: "flex", color: colors.accent, fontFamily: "Cormorant", fontSize: 150, fontWeight: 600, lineHeight: 1 }}>
                {dayNumber}
              </div>
              <div
                style={{
                  display: "flex",
                  marginTop: 34,
                  color: colors.accent,
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: 4
                }}
              >
                {monthLabel}
              </div>
            </div>
          )}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      fonts: fonts.length ? fonts : undefined,
      headers: { "Cache-Control": "public, max-age=300, s-maxage=600" }
    }
  );
}

async function loadGoogleFont(family: string, weight: number, text: string) {
  try {
    const cssUrl = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(cssUrl)).text();
    const fontUrl = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/)?.[1];
    if (!fontUrl) {
      return null;
    }

    const response = await fetch(fontUrl);
    return response.ok ? await response.arrayBuffer() : null;
  } catch {
    return null;
  }
}
