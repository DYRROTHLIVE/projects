import Link from "next/link";
import { redirect } from "next/navigation";
import AdminProjects from "@/components/admin-projects";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");
  if (user.role !== "SUPER_ADMIN") redirect("/");
  const [categories, projects, files] = await Promise.all([db.category.findMany({ orderBy: { name: "asc" } }).catch(() => []), db.project.findMany({ orderBy: { updatedAt: "desc" }, take: 100, select: { id: true, title: true, slug: true, status: true, shortDescription: true, description: true, type: true, categoryId: true, developer: true, requirements: true, license: true, seoTitle: true, seoDescription: true, demoUrl: true } }).catch(() => []), db.storedFile.findMany({ where: { scanStatus: "CLEAN", objectKey: { startsWith: "published/" } }, select: { id: true, originalName: true, contentType: true, sizeBytes: true }, orderBy: { createdAt: "desc" }, take: 100 }).catch(() => [])]);
  return <main className="simple-page"><header className="site-header"><Link href="/admin" className="text-link">← Admin dashboard</Link><Link href="/" className="brand"><span className="brand-mark">r</span>razy<span className="brand-period">.</span></Link></header><section className="simple-content admin-content"><div className="section-kicker">CONTENT</div><h1>Project management</h1><AdminProjects categories={categories} projects={projects} files={files.map((file) => ({ ...file, sizeBytes: file.sizeBytes.toString() }))} /></section></main>;
}