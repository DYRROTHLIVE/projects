import Link from "next/link";
import { redirect } from "next/navigation";
import { CampaignManager } from "@/components/admin-tools";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";
export default async function CampaignsPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");
  if (user.role !== "SUPER_ADMIN") redirect("/");
  const campaigns = await db.campaign.findMany({ include: { sponsor: true }, orderBy: { createdAt: "desc" } }).catch(() => []);
  return <main className="simple-page"><header className="site-header"><Link href="/admin" className="text-link">← Admin dashboard</Link><Link href="/" className="brand"><span className="brand-mark">r</span>razy<span className="brand-period">.</span></Link></header><section className="simple-content admin-content"><div className="section-kicker">PARTNERS</div><h1>Sponsor campaigns</h1><p>Campaigns start paused. Activation requires valid scheduled dates.</p><CampaignManager campaigns={campaigns.map((campaign) => ({ ...campaign, startsAt: campaign.startsAt.toLocaleString(), endsAt: campaign.endsAt.toLocaleString() }))} /></section></main>;
}