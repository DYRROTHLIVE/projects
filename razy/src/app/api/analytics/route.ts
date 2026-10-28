import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { analyticsEventSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const parsed = analyticsEventSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const visitorKey = createHash("sha256").update(`${process.env.SESSION_SECRET ?? "unset"}:${forwarded}`).digest("hex").slice(0, 32);
  const project = parsed.data.projectId ? await db.project.findFirst({ where: { id: parsed.data.projectId, status: "PUBLISHED" }, select: { id: true } }) : null;
  if (parsed.data.projectId && !project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  await db.analyticsEvent.create({ data: { ...parsed.data, projectId: project?.id, visitorKey, referrer: request.headers.get("referer")?.slice(0, 500) } });
  return NextResponse.json({ accepted: true }, { status: 202 });
}
