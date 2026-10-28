import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { favoriteSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const parsed = favoriteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid project" }, { status: 400 });
  const project = await db.project.findFirst({ where: { id: parsed.data.projectId, status: "PUBLISHED" }, select: { id: true } });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const [favorite, created] = await db.$transaction(async (transaction) => {
    const existing = await transaction.favorite.findUnique({ where: { userId_projectId: { userId: user.id, projectId: project.id } } });
    const saved = existing ?? await transaction.favorite.create({ data: { userId: user.id, projectId: project.id } });
    if (!existing) await transaction.analyticsEvent.create({ data: { eventType: "FAVORITE_ADDED", projectId: project.id, metadata: { userId: user.id } } });
    return [saved, !existing] as const;
  });
  return NextResponse.json({ favorite }, { status: created ? 201 : 200 });
}

export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const parsed = favoriteSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid project" }, { status: 400 });
  await db.favorite.deleteMany({ where: { userId: user.id, projectId: parsed.data.projectId } });
  return NextResponse.json({ removed: true });
}