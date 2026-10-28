import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your dashboard", robots: { index: false, follow: false } };

export default async function DashboardPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");
  const [favorites, downloads] = await Promise.all([
    db.favorite.findMany({ where: { userId: user.id }, include: { project: { include: { category: true } } }, orderBy: { createdAt: "desc" } }),
    db.downloadEvent.findMany({ where: { userId: user.id }, include: { project: { select: { title: true, slug: true } } }, orderBy: { createdAt: "desc" }, take: 20 }),
  ]);
  return <main className="simple-page"><header className="site-header"><Link href="/" className="brand"><span className="brand-mark">r</span>razy<span className="brand-period">.</span></Link><nav className="header-actions"><Link href="/explore" className="text-link">Explore projects</Link>{user.role === "SUPER_ADMIN" && <Link href="/admin" className="text-link">Admin panel</Link>}<form action="/api/auth/logout" method="post"><button className="logout-button">Log out</button></form></nav></header><section className="simple-content"><div className="section-kicker">YOUR RAZY</div><h1>Hi, {user.displayName || user.email.split("@")[0]}.</h1><p>Your saved projects and recent download activity.</p><div className="dashboard-columns"><section><h2>Saved projects</h2>{favorites.length ? <div className="project-grid">{favorites.map(({ project }) => <Link className="project-card" href={`/projects/${project.slug}`} key={project.id}><div className="project-card-body"><div className="project-category">{project.category.name}</div><h3>{project.title}</h3><p>{project.shortDescription}</p></div></Link>)}</div> : <div className="admin-card">No favorites yet. <Link href="/explore">Find something to save →</Link></div>}</section><section><h2>Recent downloads</h2>{downloads.length ? <ul className="activity-list">{downloads.map((event) => <li key={event.id}><Link href={`/projects/${event.project.slug}`}>{event.project.title}</Link><span>{event.deliveredAt ? "Delivered" : "Requested"} · {event.createdAt.toLocaleDateString()}</span></li>)}</ul> : <div className="admin-card">Download history will appear here.</div>}</section></div></section></main>;
}