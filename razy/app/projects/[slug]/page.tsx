import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import ReportProject from "@/components/report-project";

export const dynamic = "force-dynamic";

async function findProject(slug: string) {
  return db.project.findFirst({ where: { slug, status: "PUBLISHED" }, include: { category: true, versions: { orderBy: { createdAt: "desc" }, take: 1, include: { storedFile: true } }, media: { include: { storedFile: true }, orderBy: { sortOrder: "asc" } } } }).catch(() => null);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = await findProject(slug);
  if (!project) return { title: "Project not found", robots: { index: false, follow: false } };
  const canonical = `${process.env.APP_URL ?? "http://localhost:3000"}/projects/${project.slug}`;
  return { title: project.seoTitle || project.title, description: project.seoDescription || project.shortDescription, alternates: { canonical }, openGraph: { title: project.seoTitle || project.title, description: project.seoDescription || project.shortDescription, url: canonical, type: "website" } };
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = await findProject(slug);
  if (!project) notFound();
  await db.analyticsEvent.create({ data: { eventType: "PROJECT_VIEW", projectId: project.id, metadata: {} } }).catch(() => undefined);
  return <main className="simple-page"><header className="site-header"><Link href="/" className="brand"><span className="brand-mark">r</span>razy<span className="brand-period">.</span></Link><Link href="/explore" className="text-link">← Explore</Link></header><article className="project-detail"><div className="section-kicker">{project.category.name} · {project.type.replaceAll("_", " ")}</div><h1>{project.title}</h1><p className="detail-summary">{project.shortDescription}</p><div className="detail-panel"><p>{project.description}</p>{project.developer && <p><strong>Made by</strong> {project.developer}</p>}{project.supportedPlatforms.length > 0 && <p><strong>Platforms</strong> {project.supportedPlatforms.join(", ")}</p>}{project.requirements && <p><strong>Requirements</strong> {project.requirements}</p>}{project.license && <p><strong>License</strong> {project.license}</p>}{project.demoUrl && <a className="button button-dark" href={project.demoUrl} rel="nofollow noopener noreferrer" target="_blank">Visit project ↗</a>}{project.versions[0] && project.versions[0].storedFile?.scanStatus === "CLEAN" && <a className="button button-dark" href={`/api/projects/${project.id}/download`}>Download {project.versions[0].version}</a>}</div><ReportProject projectId={project.id} /></article></main>;
}