import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, recordAudit } from "@/lib/auth";
import { categorySchema } from "@/lib/validators";
import { quarantineToPublished } from "@/lib/storage";

async function admin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "SUPER_ADMIN") return { response: NextResponse.json({ error: "Forbidden" }, { status: user ? 403 : 401 }) };
  return { user };
}

export async function GET(request: Request) {
  const auth = await admin();
  if (auth.response) return auth.response;
  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim().slice(0, 120);
  if (q) {
    const users = await db.user.findMany({ where: { OR: [{ email: { contains: q, mode: "insensitive" } }, { displayName: { contains: q, mode: "insensitive" } }] }, select: { id: true, email: true, displayName: true, role: true, status: true, createdAt: true }, take: 50, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ users });
  }
  if (url.searchParams.get("reports") === "1") {
    const reports = await db.report.findMany({ include: { user: { select: { email: true } }, project: { select: { title: true, slug: true } } }, orderBy: { createdAt: "desc" }, take: 100 });
    return NextResponse.json({ reports });
  }
  if (url.searchParams.get("audit") === "1") {
    const audit = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
    return NextResponse.json({ audit });
  }
  if (url.searchParams.get("campaigns") === "1") {
    const campaigns = await db.campaign.findMany({ include: { sponsor: true, placements: { include: { project: { select: { title: true, slug: true } } } } }, orderBy: { createdAt: "desc" } });
    return NextResponse.json({ campaigns });
  }
  if (url.searchParams.get("settings") === "1") {
    const [site, seo] = await Promise.all([db.siteSettings.findUnique({ where: { id: 1 } }), db.sEOSettings.findUnique({ where: { id: 1 } })]);
    return NextResponse.json({ site, seo });
  }
  const [users, publishedProjects, draftProjects, openReports, events, recentAudit, categories, pendingFiles] = await Promise.all([
    db.user.count(), db.project.count({ where: { status: "PUBLISHED" } }), db.project.count({ where: { status: "DRAFT" } }),
    db.report.count({ where: { status: "OPEN" } }), db.analyticsEvent.groupBy({ by: ["eventType"], _count: { _all: true } }),
    db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 30 }), db.category.findMany({ orderBy: { name: "asc" } }),
    db.storedFile.count({ where: { scanStatus: "PENDING" } }),
  ]);
  return NextResponse.json({ totals: { users, publishedProjects, draftProjects, openReports, pendingFiles }, events, recentAudit, categories });
}

export async function PATCH(request: Request) {
  const auth = await admin();
  if (auth.response) return auth.response;
  const body = await request.json().catch(() => null) as { userId?: unknown; status?: unknown; reportId?: unknown; reportStatus?: unknown; fileId?: unknown; scanStatus?: unknown; campaignId?: unknown; campaignStatus?: unknown } | null;
  if (!body) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  if (typeof body.userId === "string" && (body.status === "ACTIVE" || body.status === "SUSPENDED" || body.status === "BLOCKED")) {
    const target = await db.user.findUnique({ where: { id: body.userId }, select: { id: true, role: true } });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (target.role === "SUPER_ADMIN") return NextResponse.json({ error: "Super Admin accounts cannot be suspended here" }, { status: 403 });
    await db.user.update({ where: { id: target.id }, data: { status: body.status } });
    await recordAudit(auth.user.id, `USER_${body.status}`, "User", target.id);
    return NextResponse.json({ updated: true });
  }
  if (typeof body.reportId === "string" && (body.reportStatus === "REVIEWING" || body.reportStatus === "RESOLVED" || body.reportStatus === "REJECTED")) {
    await db.report.update({ where: { id: body.reportId }, data: { status: body.reportStatus, resolvedAt: body.reportStatus === "RESOLVED" || body.reportStatus === "REJECTED" ? new Date() : null } });
    await recordAudit(auth.user.id, `REPORT_${body.reportStatus}`, "Report", body.reportId);
    return NextResponse.json({ updated: true });
  }
  if (typeof body.fileId === "string" && (body.scanStatus === "FLAGGED" || body.scanStatus === "FAILED")) {
    const file = await db.storedFile.findUnique({ where: { id: body.fileId }, select: { id: true, objectKey: true } });
    if (!file) return NextResponse.json({ error: "File not found" }, { status: 404 });
    await db.storedFile.update({ where: { id: file.id }, data: { scanStatus: body.scanStatus, verifiedAt: null } });
    await recordAudit(auth.user.id, `FILE_SCAN_${body.scanStatus}`, "StoredFile", file.id);
    return NextResponse.json({ updated: true, objectKey: file.objectKey });
  }
  if (typeof body.fileId === "string" && body.scanStatus === "CLEAN") {
    const file = await db.storedFile.findUnique({ where: { id: body.fileId } });
    if (!file || file.scanStatus !== "PENDING" || !file.objectKey.startsWith("quarantine/")) return NextResponse.json({ error: "File is not awaiting scanner approval" }, { status: 409 });
    if (!process.env.MALWARE_SCAN_PROVIDER_KEY) return NextResponse.json({ error: "A malware scanner is not configured; files cannot be approved" }, { status: 503 });
    return NextResponse.json({ error: "Configured malware scanner adapter is not implemented; file remains quarantined" }, { status: 503 });
  }
  if (typeof body.campaignId === "string" && (body.campaignStatus === "ACTIVE" || body.campaignStatus === "PAUSED" || body.campaignStatus === "ENDED")) {
    const campaign = await db.campaign.findUnique({ where: { id: body.campaignId }, include: { sponsor: true } });
    if (!campaign) return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    if (body.campaignStatus === "ACTIVE" && (campaign.startsAt > new Date() || campaign.endsAt <= new Date())) return NextResponse.json({ error: "Campaign must be within its scheduled dates" }, { status: 409 });
    await db.campaign.update({ where: { id: campaign.id }, data: { status: body.campaignStatus } });
    await db.sponsor.update({ where: { id: campaign.sponsorId }, data: { active: body.campaignStatus === "ACTIVE" } });
    await recordAudit(auth.user.id, `CAMPAIGN_${body.campaignStatus}`, "Campaign", campaign.id);
    return NextResponse.json({ updated: true });
  }
  return NextResponse.json({ error: "Invalid administrative action" }, { status: 400 });
}

export async function POST(request: Request) {
  const auth = await admin();
  if (auth.response) return auth.response;
  const rawBody = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (rawBody && "sponsorName" in rawBody) {
    const { sponsorName, destination, campaignName, startsAt, endsAt, placement } = rawBody;
    if (typeof sponsorName !== "string" || sponsorName.trim().length < 2 || sponsorName.length > 120 || typeof destination !== "string" || !/^https:\/\//.test(destination) || typeof campaignName !== "string" || campaignName.trim().length < 2 || campaignName.length > 120 || typeof startsAt !== "string" || typeof endsAt !== "string" || !Number.isFinite(Date.parse(startsAt)) || !Number.isFinite(Date.parse(endsAt)) || Date.parse(endsAt) <= Date.parse(startsAt)) return NextResponse.json({ error: "Invalid sponsor campaign details" }, { status: 400 });
    try {
      const sponsor = await db.sponsor.create({ data: { name: sponsorName.trim(), destination, active: false, campaigns: { create: { name: campaignName.trim(), startsAt: new Date(startsAt), endsAt: new Date(endsAt), status: "PAUSED", placements: { create: { type: placement === "PROJECT_PAGE" || placement === "CATEGORY" || placement === "HOMEPAGE_FEATURE" ? placement : "BANNER" } } } } }, include: { campaigns: true } });
      await recordAudit(auth.user.id, "CAMPAIGN_CREATED", "Campaign", sponsor.campaigns[0]?.id);
      return NextResponse.json({ sponsor }, { status: 201 });
    } catch { return NextResponse.json({ error: "Unable to create sponsor campaign" }, { status: 400 }); }
  }
  const parsed = categorySchema.safeParse(rawBody);
  if (!parsed.success) return NextResponse.json({ error: "Invalid category" }, { status: 400 });
  try {
    const category = await db.category.create({ data: parsed.data });
    await recordAudit(auth.user.id, "CATEGORY_CREATED", "Category", category.id);
    return NextResponse.json({ category }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Category name or slug already exists" }, { status: 409 });
  }
}

export async function PUT(request: Request) {
  const auth = await admin();
  if (auth.response) return auth.response;
  const body = await request.json().catch(() => null) as { announcement?: unknown; adsEnabled?: unknown; newsletterUrl?: unknown; defaultTitle?: unknown; defaultDescription?: unknown; canonicalBaseUrl?: unknown; verificationCode?: unknown } | null;
  if (!body || (body.announcement !== undefined && body.announcement !== null && (typeof body.announcement !== "string" || body.announcement.length > 500)) || (body.adsEnabled !== undefined && typeof body.adsEnabled !== "boolean") || (body.newsletterUrl !== undefined && typeof body.newsletterUrl !== "string") || (body.defaultTitle !== undefined && (typeof body.defaultTitle !== "string" || body.defaultTitle.length > 120)) || (body.defaultDescription !== undefined && (typeof body.defaultDescription !== "string" || body.defaultDescription.length > 320)) || (body.canonicalBaseUrl !== undefined && (typeof body.canonicalBaseUrl !== "string" || !/^https:\/\//.test(body.canonicalBaseUrl)))) return NextResponse.json({ error: "Invalid settings" }, { status: 400 });
  const { announcement, adsEnabled, newsletterUrl, defaultTitle, defaultDescription, canonicalBaseUrl, verificationCode } = body;
  const operations: Array<Promise<unknown>> = [];
  if (announcement !== undefined || adsEnabled !== undefined || newsletterUrl !== undefined) operations.push(db.siteSettings.upsert({ where: { id: 1 }, create: { id: 1, announcement: typeof announcement === "string" ? announcement : null, adsEnabled: adsEnabled === true, newsletterUrl: typeof newsletterUrl === "string" ? newsletterUrl : null }, update: { ...(announcement !== undefined ? { announcement } : {}), ...(adsEnabled !== undefined ? { adsEnabled } : {}), ...(newsletterUrl !== undefined ? { newsletterUrl } : {}) } }));
  if (defaultTitle !== undefined || defaultDescription !== undefined || canonicalBaseUrl !== undefined || verificationCode !== undefined) operations.push(db.sEOSettings.upsert({ where: { id: 1 }, create: { id: 1, defaultTitle: typeof defaultTitle === "string" ? defaultTitle : "RAZY — Good projects. Good people.", defaultDescription: typeof defaultDescription === "string" ? defaultDescription : "A home for the things people make.", canonicalBaseUrl: typeof canonicalBaseUrl === "string" ? canonicalBaseUrl : process.env.APP_URL ?? "http://localhost:3000", ...(typeof verificationCode === "string" ? { verificationCode } : {}) }, update: { ...(defaultTitle !== undefined ? { defaultTitle } : {}), ...(defaultDescription !== undefined ? { defaultDescription } : {}), ...(canonicalBaseUrl !== undefined ? { canonicalBaseUrl } : {}), ...(verificationCode !== undefined ? { verificationCode } : {}) } }));
  await Promise.all(operations);
  await recordAudit(auth.user.id, "SITE_SETTINGS_UPDATED", "Settings", "1");
  return NextResponse.json({ updated: true });
}