import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { registrationSchema } from "@/lib/validators";

export async function POST(request: Request) {
  const parsed = registrationSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid registration details" }, { status: 400 });
  const existing = await db.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "Unable to create account with those details" }, { status: 409 });
  const user = await db.user.create({ data: { email: parsed.data.email, displayName: parsed.data.displayName, passwordHash: await hashPassword(parsed.data.password) }, select: { id: true, email: true } });
  return NextResponse.json({ user, message: "Account created. Email verification must be configured before sign-in is enabled." }, { status: 201 });
}
