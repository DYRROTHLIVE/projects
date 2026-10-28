import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { createUploadUrl } from "@/lib/storage";
import { uploadSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: user ? 403 : 401 });
  const parsed = uploadSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid upload details" }, { status: 400 });
  try { return NextResponse.json(await createUploadUrl(parsed.data.name, parsed.data.size, parsed.data.contentType), { status: 201 }); }
  catch { return NextResponse.json({ error: "Upload is unavailable or file details are not allowed" }, { status: 400 }); }
}