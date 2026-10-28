import Link from "next/link";
import { redirect } from "next/navigation";
import { UserSearch } from "@/components/admin-tools";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "User management", robots: { index: false, follow: false } };
export default async function UsersPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");
  if (user.role !== "SUPER_ADMIN") redirect("/");
  return <main className="simple-page"><header className="site-header"><Link href="/admin" className="text-link">← Admin dashboard</Link><Link href="/" className="brand"><span className="brand-mark">r</span>razy<span className="brand-period">.</span></Link></header><section className="simple-content admin-content"><div className="section-kicker">ACCOUNTS</div><h1>User management</h1><UserSearch /></section></main>;
}