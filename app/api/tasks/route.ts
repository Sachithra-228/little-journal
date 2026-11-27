import { NextResponse } from "next/server";
import { isKnownJournal } from "@/lib/journals";
import { getDatabaseName, getMongoClient, hasMongoConfig } from "@/lib/mongodb";
import { verifyOwnerPattern } from "@/lib/owner-auth";
import type { DiaryTask } from "@/types/diary";

export const runtime = "nodejs";

async function getTasksCollection() {
  const client = await getMongoClient();
  return client.db(getDatabaseName()).collection<DiaryTask>("tasks");
}

// Tasks are the owner's own to-do list, so every request needs the pattern.
function checkOwner(request: Request) {
  if (!process.env.OWNER_PATTERN || !hasMongoConfig()) {
    return NextResponse.json({ message: "The diary is not fully configured." }, { status: 503 });
  }

  if (!verifyOwnerPattern(request.headers.get("x-owner-pattern") ?? "")) {
    return NextResponse.json({ message: "Owner unlock is required." }, { status: 401 });
  }

  return null;
}

function errorResponse(action: string, error: unknown) {
  const message = error instanceof Error ? error.message : "Unknown MongoDB error.";
  return NextResponse.json({ message: `Could not ${action}: ${message}` }, { status: 500 });
}

function normalizeTask(value: unknown): DiaryTask | null {
  const task = value as Partial<DiaryTask> | null;
  const isDay = (day: unknown) => typeof day === "string" && /^\d{4}-\d{2}-\d{2}$/.test(day);

  if (
    !task ||
    typeof task.id !== "string" ||
    !isKnownJournal(task.journal) ||
    typeof task.text !== "string" ||
    !task.text.trim() ||
    !isDay(task.date)
  ) {
    return null;
  }

  const done = task.done === true;
  return {
    id: task.id,
    journal: task.journal,
    text: task.text.trim().slice(0, 200),
    done,
    date: task.date as string,
    doneDate: done && isDay(task.doneDate) ? task.doneDate : undefined,
    createdAt: typeof task.createdAt === "string" ? task.createdAt : new Date().toISOString()
  };
}

export async function GET(request: Request) {
  const denied = checkOwner(request);
  if (denied) {
    return denied;
  }

  const journal = new URL(request.url).searchParams.get("journal");
  if (!isKnownJournal(journal)) {
    return NextResponse.json({ message: "Unknown diary." }, { status: 400 });
  }

  try {
    const collection = await getTasksCollection();
    const tasks = await collection
      .find({ journal }, { projection: { _id: 0 } })
      .sort({ createdAt: 1 })
      .toArray();
    return NextResponse.json({ tasks });
  } catch (error) {
    return errorResponse("load tasks", error);
  }
}

export async function POST(request: Request) {
  const denied = checkOwner(request);
  if (denied) {
    return denied;
  }

  try {
    const body = (await request.json()) as { task?: unknown };
    const task = normalizeTask(body.task);
    if (!task) {
      return NextResponse.json({ message: "That task could not be read." }, { status: 400 });
    }

    const collection = await getTasksCollection();
    await collection.replaceOne({ id: task.id }, task, { upsert: true });
    return NextResponse.json({ task });
  } catch (error) {
    return errorResponse("save the task", error);
  }
}

// ?id=<task> removes one task; ?journal=<diary>&ids=a,b removes several (clear done).
export async function DELETE(request: Request) {
  const denied = checkOwner(request);
  if (denied) {
    return denied;
  }

  const params = new URL(request.url).searchParams;
  const ids = (params.get("ids") ?? params.get("id") ?? "").split(",").filter(Boolean);
  if (!ids.length) {
    return NextResponse.json({ message: "Missing task id." }, { status: 400 });
  }

  try {
    const collection = await getTasksCollection();
    await collection.deleteMany({ id: { $in: ids } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return errorResponse("delete the tasks", error);
  }
}
