import { NextResponse } from "next/server";
import { logout } from "@/lib/auth";

export async function POST() {
  try {
    await logout();
    return NextResponse.json({ signedOut: true });
  } catch {
    return NextResponse.json({ error: "Sign out is temporarily unavailable" }, { status: 503 });
  }
}