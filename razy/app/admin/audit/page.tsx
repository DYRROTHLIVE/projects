import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function AuditPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");
  if (user.role !== "SUPER_ADMIN") redirect("/");
  const entries = await db.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 200 }).catch(() => []);
  return <main className="simple-page"><header className="site-header"><Link href="/admin" className="text-link">← Admin dashboard</Link><Link href="/" className="brand"><span className="brand-mark">r</span>razy<span className="brand-period">.</span></Link></header><section className="simple-content admin-content"><div className="section-kicker">ACCOUNTABILITY</div><h1>Audit log</h1><section className="admin-card"><ul className="activity-list">{entries.map((entry) => <li key={entry.id}><strong>{entry.action}</strong><span>{entry.targetType}{entry.targetId ? ` · ${entry.targetId}` : ""} · actor {entry.actorId ?? "system"} · {entry.createdAt.toLocaleString()}</span>{entry.reason && <span>{entry.reason}</span>}</li>)}</ul>{!entries.length && <p>No audit events recorded.</p>}</section></section></main>;
}