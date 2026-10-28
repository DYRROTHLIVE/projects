import Link from "next/link";
import { redirect } from "next/navigation";
import { SettingsForm } from "@/components/admin-tools";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function SettingsPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");
  if (user.role !== "SUPER_ADMIN") redirect("/");
  const [site, seo] = await Promise.all([db.siteSettings.findUnique({ where: { id: 1 } }).catch(() => null), db.sEOSettings.findUnique({ where: { id: 1 } }).catch(() => null)]);
  return <main className="simple-page"><header className="site-header"><Link href="/admin" className="text-link">← Admin dashboard</Link><Link href="/" className="brand"><span className="brand-mark">r</span>razy<span className="brand-period">.</span></Link></header><section className="simple-content admin-content"><div className="section-kicker">CONFIGURATION</div><h1>Site settings</h1><SettingsForm site={site} seo={seo} /></section></main>;
}