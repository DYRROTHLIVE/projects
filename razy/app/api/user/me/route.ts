import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  const [favorites, downloads] = await Promise.all([
    db.favorite.findMany({ where: { userId: user.id }, include: { project: { include: { category: true } } }, orderBy: { createdAt: "desc" } }),
    db.downloadEvent.findMany({ where: { userId: user.id }, include: { project: { select: { title: true, slug: true } } }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);
  return NextResponse.json({ user: { id: user.id, email: user.email, displayName: user.displayName, role: user.role }, favorites, downloads });
}