import type { Metadata } from "next";
import Link from "next/link";
import AuthForm from "@/components/auth-form";

export const metadata: Metadata = { title: "Create an account", robots: { index: false, follow: false } };

export default function RegisterPage() {
  return <main className="simple-page"><header className="site-header"><Link href="/" className="brand"><span className="brand-mark">r</span>razy<span className="brand-period">.</span></Link><Link href="/explore" className="text-link">Explore projects</Link></header><section className="auth-panel"><div className="section-kicker">MAKE YOURSELF AT HOME</div><h1>Join the good stuff.</h1><p>Create an account to save the projects you love.</p><AuthForm mode="register" /><div className="auth-switch">Already have an account? <Link href="/login">Log in</Link></div></section></main>;
}