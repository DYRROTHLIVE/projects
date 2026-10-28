import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { projectSearchSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const parsed = projectSearchSchema.safeParse(Object.fromEntries(params));
  if (!parsed.success) return NextResponse.json({ error: "Invalid search filters" }, { status: 400 });
  const { q, category, type, sort, page } = parsed.data;
  const where = { status: "PUBLISHED" as const, ...(type ? { type } : {}), ...(category ? { category: { slug: category } } : {}), ...(q ? { OR: [{ title: { contains: q, mode: "insensitive" as const } }, { shortDescription: { contains: q, mode: "insensitive" as const } }] } : {}) };
  const orderBy = sort === "title" ? { title: "asc" as const } : sort === "updated" ? { updatedAt: "desc" as const } : { publishedAt: "desc" as const };
  const [projects, total] = await Promise.all([
    db.project.findMany({ where, orderBy, skip: (page - 1) * 24, take: 24, include: { category: true, media: { where: { kind: "THUMBNAIL" }, include: { storedFile: true }, take: 1 } } }),
    db.project.count({ where }),
  ]);
  return NextResponse.json({ projects, total, page, pageSize: 24 });
}
