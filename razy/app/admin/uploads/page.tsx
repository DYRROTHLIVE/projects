import Link from "next/link";
import { redirect } from "next/navigation";
import { ScannerGate, UploadPanel } from "@/components/admin-tools";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function UploadsPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");
  if (user.role !== "SUPER_ADMIN") redirect("/");
  const files = await db.storedFile.findMany({ orderBy: { createdAt: "desc" }, take: 100, select: { id: true, originalName: true, contentType: true, sizeBytes: true, scanStatus: true, createdAt: true, objectKey: true } }).catch(() => []);
  return <main className="simple-page"><header className="site-header"><Link href="/admin" className="text-link">← Admin dashboard</Link><Link href="/" className="brand"><span className="brand-mark">r</span>razy<span className="brand-period">.</span></Link></header><section className="simple-content admin-content"><div className="section-kicker">FILE MANAGEMENT</div><h1>Uploads</h1><UploadPanel /><ScannerGate files={files.map((file) => ({ id: file.id, name: file.originalName, status: file.scanStatus }))} /><section className="admin-card"><h2>Recent files</h2><ul className="activity-list">{files.map((file) => <li key={file.id}><strong>{file.originalName}</strong><span>{file.contentType} · {(Number(file.sizeBytes) / 1024 / 1024).toFixed(1)} MB · {file.scanStatus} · {file.createdAt.toLocaleString()}</span></li>)}</ul>{!files.length && <p>No uploaded files.</p>}</section></section></main>;
}