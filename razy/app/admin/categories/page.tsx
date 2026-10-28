import Link from "next/link";
import { redirect } from "next/navigation";
import { CategoryManager } from "@/components/admin-tools";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function CategoriesPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");
  if (user.role !== "SUPER_ADMIN") redirect("/");
  const categories = await db.category.findMany({ orderBy: { name: "asc" } }).catch(() => []);
  return <main className="simple-page"><header className="site-header"><Link href="/admin" className="text-link">← Admin dashboard</Link><Link href="/" className="brand"><span className="brand-mark">r</span>razy<span className="brand-period">.</span></Link></header><section className="simple-content admin-content"><div className="section-kicker">TAXONOMY</div><h1>Categories</h1><CategoryManager categories={categories} /></section></main>;
}