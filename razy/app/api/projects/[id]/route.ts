import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit } from "@/lib/auth";
import { projectDraftSchema, projectStatusSchema } from "@/lib/validators";

type Context = { params: Promise<{ id: string }> };

async function admin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") return { response: NextResponse.json({ error: "Forbidden" }, { status: user ? 403 : 401 }) };
  return { user };
}

export async function PATCH(request: Request, context: Context) {
  const auth = await admin();
  if (auth.response) return auth.response;
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as unknown;
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid project update" }, { status: 400 });
  const update = body as Record<string, unknown>;
  try {
    if ("status" in update) {
      const parsed = projectStatusSchema.safeParse(update.status);
      if (!parsed.success) return NextResponse.json({ error: "Invalid project status" }, { status: 400 });
      const status = parsed.data;
      if (status === "PUBLISHED") {
        const files = await db.projectVersion.findMany({ where: { projectId: id, storedFileId: { not: null } }, include: { storedFile: true } });
        if (files.some((version) => !version.storedFile || version.storedFile.scanStatus !== "CLEAN" || !version.storedFile.objectKey.startsWith("published/"))) return NextResponse.json({ error: "All attached files must pass malware scanning and publication checks first" }, { status: 409 });
      }
      const project = await db.project.update({ where: { id }, data: { status, publishedAt: status === "PUBLISHED" ? new Date() : null } });
      await recordAudit(auth.user.id, `PROJECT_${status}`, "Project", id);
      return NextResponse.json({ project });
    }
    const parsed = projectDraftSchema.safeParse(update);
    if (!parsed.success) return NextResponse.json({ error: "Invalid project details", issues: parsed.error.issues }, { status: 400 });
    const data = parsed.data;
    if (data.storedFileId) {
      const file = await db.storedFile.findUnique({ where: { id: data.storedFileId }, select: { scanStatus: true, objectKey: true } });
      if (!file || file.scanStatus !== "CLEAN" || !file.objectKey.startsWith("published/")) return NextResponse.json({ error: "Select a file that has passed scanning and publication checks" }, { status: 409 });
    }
    const project = await db.project.update({ where: { id }, data: {
      title: data.title, slug: data.slug, shortDescription: data.shortDescription, description: data.description,
      type: data.type, categoryId: data.categoryId, developer: data.developer, requirements: data.requirements,
      license: data.license, seoTitle: data.seoTitle, seoDescription: data.seoDescription,
      supportedPlatforms: data.supportedPlatforms, demoUrl: data.demoUrl || null,
      ...(data.storedFileId && data.version ? { versions: { create: { storedFileId: data.storedFileId, version: data.version, releaseNotes: "Release" } } } : {}),
    }, include: { category: true } });
    await recordAudit(auth.user.id, "PROJECT_UPDATED", "Project", id);
    return NextResponse.json({ project });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") return NextResponse.json({ error: "Project not found" }, { status: 404 });
    if (error && typeof error === "object" && "code" in error && error.code === "P2002") return NextResponse.json({ error: "A project with that slug already exists" }, { status: 409 });
    return NextResponse.json({ error: "Unable to update project" }, { status: 503 });
  }
}

export async function DELETE(_request: Request, context: Context) {
  const auth = await admin();
  if (auth.response) return auth.response;
  const { id } = await context.params;
  try {
    await db.project.delete({ where: { id } });
    await recordAudit(auth.user.id, "PROJECT_DELETED", "Project", id);
    return NextResponse.json({ deleted: true });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "P2025") return NextResponse.json({ error: "Project not found" }, { status: 404 });
    return NextResponse.json({ error: "Unable to delete project; linked history may prevent deletion" }, { status: 409 });
  }
}