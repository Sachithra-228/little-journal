import { NextResponse } from "next/server";
import { setPersonalPublic } from "@/lib/entries-db";
import { hasMongoConfig } from "@/lib/mongodb";
import { verifyOwnerPattern } from "@/lib/owner-auth";

export const runtime = "nodejs";

export async function PUT(request: Request) {
  if (!process.env.OWNER_PATTERN || !hasMongoConfig()) {
    return NextResponse.json({ message: "The diary is not fully configured." }, { status: 503 });
  }

  if (!verifyOwnerPattern(request.headers.get("x-owner-pattern") ?? "")) {
    return NextResponse.json({ message: "Owner unlock is required." }, { status: 401 });
  }

  try {
    const body = (await request.json()) as { personalPublic?: unknown };
    if (typeof body.personalPublic !== "boolean") {
      return NextResponse.json({ message: "Missing personalPublic." }, { status: 400 });
    }

    await setPersonalPublic(body.personalPublic);
    return NextResponse.json({ personalPublic: body.personalPublic });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown MongoDB error.";
    return NextResponse.json({ message: `Could not save the setting: ${message}` }, { status: 500 });
  }
}
