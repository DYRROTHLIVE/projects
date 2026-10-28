import type { Metadata } from "next";
import Link from "next/link";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Project categories" };

export default async function CategoriesPage() {
  const categories = await db.category.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { projects: { where: { status: "PUBLISHED" } } } } } }).catch(() => []);
  return <main className="simple-page"><header className="site-header"><Link href="/" className="brand"><span className="brand-mark">r</span>razy<span className="brand-period">.</span></Link><Link href="/explore" className="text-link">Explore projects</Link></header><section className="simple-content"><div className="section-kicker">FIND YOUR CORNER</div><h1>Browse by category.</h1><p>Explore published projects grouped by what they do.</p><div className="category-grid category-list">{categories.map((category) => <Link className="category-card mint" key={category.id} href={`/explore?category=${encodeURIComponent(category.slug)}`}><span className="category-name">{category.name}</span><span className="category-count">{category._count.projects} projects</span></Link>)}</div>{!categories.length && <div className="empty-projects"><h3>Categories are being arranged.</h3></div>}</section></main>;
}