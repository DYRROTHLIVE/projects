import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { getPublishedObject } from "@/lib/storage";

export const runtime = "nodejs";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const project = await db.project.findFirst({ where: { id, status: "PUBLISHED" }, include: { versions: { orderBy: { createdAt: "desc" }, take: 1, include: { storedFile: true } } } });
  const file = project?.versions[0]?.storedFile;
  if (!project || !file || file.scanStatus !== "CLEAN" || !file.objectKey.startsWith("published/")) return NextResponse.json({ error: "Download is not available" }, { status: 404 });
  if (!file.verifiedAt) return NextResponse.json({ error: "Download has not passed security verification" }, { status: 404 });
  const user = await getCurrentUser();
  const requestId = randomUUID();
  const event = await db.downloadEvent.create({ data: { projectId: project.id, userId: user?.id, versionId: project.versions[0].id, requestId } });
  try {
    const object = await getPublishedObject(file.objectKey);
    if (!object.Body) throw new Error("Empty storage response");
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of object.Body as AsyncIterable<Uint8Array>) controller.enqueue(new Uint8Array(chunk));
          await db.downloadEvent.update({ where: { id: event.id }, data: { deliveredAt: new Date() } });
          await db.analyticsEvent.create({ data: { eventType: "DOWNLOAD_DELIVERED", projectId: project.id, metadata: { requestId } } });
          controller.close();
        } catch {
          controller.error(new Error("Download delivery failed"));
        }
      },
    });
    await db.analyticsEvent.create({ data: { eventType: "DOWNLOAD_REQUESTED", projectId: project.id, metadata: { requestId } } });
    return new Response(body, { headers: { "content-type": file.contentType, "content-length": file.sizeBytes.toString(), "content-disposition": `attachment; filename="${file.safeName.replace(/["\\\r\n]/g, "_")}"`, "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
  } catch {
    await db.analyticsEvent.create({ data: { eventType: "DOWNLOAD_REQUESTED", projectId: project.id, metadata: { requestId, failed: true } } }).catch(() => undefined);
    return NextResponse.json({ error: "Download delivery is temporarily unavailable" }, { status: 503 });
  }
}