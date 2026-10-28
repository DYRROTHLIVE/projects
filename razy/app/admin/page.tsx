import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Admin dashboard", robots: { index: false, follow: false } };

export default async function AdminPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");
  if (user.role !== "SUPER_ADMIN") redirect("/");
  const [users, published, drafts, reports, pendingFiles, events, audit, registrations] = await Promise.all([
    db.user.count(), db.project.count({ where: { status: "PUBLISHED" } }), db.project.count({ where: { status: "DRAFT" } }),
    db.report.count({ where: { status: "OPEN" } }), db.storedFile.count({ where: { scanStatus: "PENDING" } }),
    db.analyticsEvent.groupBy({ by: ["eventType"], _count: { _all: true } }), db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 12 }),
    db.analyticsEvent.count({ where: { eventType: "PAGE_VIEW", metadata: { path: ["action"], equals: "registration" } } }),
  ]).catch(() => [0, 0, 0, 0, 0, [], [], 0] as const);
  const totals = new Map(events.map((event) => [event.eventType, event._count._all]));
  return <main className="simple-page"><header className="site-header"><Link href="/" className="brand"><span className="brand-mark">r</span>razy<span className="brand-period">.</span></Link><nav className="header-actions"><Link href="/dashboard" className="text-link">Your account</Link><form action="/api/auth/logout" method="post"><button className="logout-button">Log out</button></form></nav></header><section className="simple-content admin-content"><div className="section-kicker">RAZY CONTROL ROOM</div><h1>Admin dashboard</h1><p>Signed in as {user.email}. Privileged actions are restricted to Super Admins.</p><div className="admin-nav">{[["Projects", "/admin/projects"], ["Uploads", "/admin/uploads"], ["Categories", "/admin/categories"], ["Users", "/admin/users"], ["Reports", "/admin/reports"], ["Campaigns", "/admin/campaigns"], ["Settings", "/admin/settings"], ["Audit log", "/admin/audit"]].map(([label, href]) => <Link className="admin-card" key={href} href={href}>{label} →</Link>)}</div><div className="stats-grid">{[["Users", users], ["Registrations", registrations], ["Published projects", published], ["Draft projects", drafts], ["Open reports", reports], ["Files awaiting scan", pendingFiles], ["Project views", totals.get("PROJECT_VIEW") ?? 0], ["Searches", totals.get("SEARCH") ?? 0], ["Completed downloads", totals.get("DOWNLOAD_DELIVERED") ?? 0]].map(([label, value]) => <div className="stat-card" key={label}><span>{label}</span><strong>{value}</strong></div>)}</div><section className="admin-card"><h2>Recent audit events</h2><ul className="activity-list">{audit.map((entry) => <li key={entry.id}><strong>{entry.action}</strong><span>{entry.targetType}{entry.targetId ? ` · ${entry.targetId}` : ""} · {entry.createdAt.toLocaleString()}</span></li>)}</ul></section></section></main>;
}