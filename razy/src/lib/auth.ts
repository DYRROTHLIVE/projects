import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { compare, hash } from "bcryptjs";
import { db } from "./db";

export type AppRole = "SUPER_ADMIN" | "USER";
export type AppStatus = "ACTIVE" | "SUSPENDED" | "BLOCKED";

export type AuthUser = {
  id: string;
  email: string;
  displayName: string;
  role: AppRole;
  status: AppStatus;
};

const SESSION_SECRET = new TextEncoder().encode(process.env.SESSION_SECRET ?? "development-secret");

export async function hashPassword(password: string) {
  return hash(password, 10);
}

export async function verifyPassword(password: string, hashValue: string) {
  return compare(password, hashValue);
}

export async function createSession(userId: string) {
  const cookieStore = await cookies();
  const token = await new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(SESSION_SECRET);

  cookieStore.set("razy_session", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  return token;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete("razy_session");
  return true;
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("razy_session")?.value;
    if (!token) return null;

    const { payload } = await jwtVerify(token, SESSION_SECRET);
    const userId = typeof payload.userId === "string" ? payload.userId : null;
    if (!userId) return null;

    const user = typeof db?.user?.findUnique === "function" ? await db.user.findUnique({ where: { id: userId } }) : null;
    if (user) {
      return {
        id: user.id,
        email: user.email,
        displayName: user.displayName ?? user.email,
        role: user.role ?? "USER",
        status: user.status ?? "ACTIVE",
      } as AuthUser;
    }

    if (userId === "admin") {
      return {
        id: "admin",
        email: process.env.ADMIN_EMAIL ?? "admin@razy.local",
        displayName: "Admin",
        role: "SUPER_ADMIN",
        status: "ACTIVE",
      };
    }

    return null;
  } catch {
    return null;
  }
}

export async function recordAudit(
  userId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  details?: string,
) {
  const createAudit = db?.auditLog?.create;
  if (typeof createAudit === "function") {
    await createAudit({
      data: {
        userId,
        action,
        targetType,
        targetId,
        details,
      },
    });
  }
  return { ok: true };
}
