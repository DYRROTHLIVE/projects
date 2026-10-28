import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit } from "@/lib/auth";
import { inspectQuarantinedObject } from "@/lib/storage";
import { uploadSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: user ? 403 : 401 });
  const body = await request.json().catch(() => null) as { key?: unknown; name?: unknown; size?: unknown; contentType?: unknown } | null;
  const parsed = uploadSchema.safeParse(body && { name: body.name, size: body.size, contentType: body.contentType });
  if (!parsed.success || typeof body?.key !== "string" || !/^quarantine\/[0-9a-f-]{36}\.(apk|zip|png|jpg|jpeg|webp|pdf)$/i.test(body.key)) return NextResponse.json({ error: "Invalid upload details" }, { status: 400 });
  try {
    const checked = await inspectQuarantinedObject(body.key, parsed.data.size, parsed.data.name, parsed.data.contentType);
    const file = await db.storedFile.create({ data: { objectKey: checked.objectKey, originalName: parsed.data.name, safeName: checked.safeName, contentType: parsed.data.contentType, sizeBytes: BigInt(checked.sizeBytes), sha256: checked.sha256, scanStatus: "PENDING" } });
    await recordAudit(user.id, "FILE_QUARANTINED", "StoredFile", file.id, "Awaiting malware scan");
    return NextResponse.json({ file: { ...file, sizeBytes: file.sizeBytes.toString() }, quarantined: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Upload could not be verified" }, { status: 400 });
  }
}