import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { reportSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const parsed = reportSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid report" }, { status: 400 });
  const user = await getCurrentUser();
  if (parsed.data.projectId) {
    const project = await db.project.findFirst({ where: { id: parsed.data.projectId, status: "PUBLISHED" }, select: { id: true } });
    if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }
  const report = await db.report.create({ data: { ...parsed.data, userId: user?.id } });
  return NextResponse.json({ reportId: report.id, received: true }, { status: 201 });
}