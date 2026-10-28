import Link from "next/link";
import { redirect } from "next/navigation";
import { ReportManager } from "@/components/admin-tools";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function ReportsPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");
  if (user.role !== "SUPER_ADMIN") redirect("/");
  const reports = await db.report.findMany({ include: { user: { select: { email: true } }, project: { select: { title: true, slug: true } } }, orderBy: { createdAt: "desc" }, take: 100 }).catch(() => []);
  return <main className="simple-page"><header className="site-header"><Link href="/admin" className="text-link">← Admin dashboard</Link><Link href="/" className="brand"><span className="brand-mark">r</span>razy<span className="brand-period">.</span></Link></header><section className="simple-content admin-content"><div className="section-kicker">TRUST &amp; SAFETY</div><h1>Reports</h1><ReportManager reports={reports.map((report) => ({ ...report, createdAt: report.createdAt.toLocaleString() }))} /></section></main>;
}