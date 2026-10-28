import type { Metadata } from "next";
import Link from "next/link";
import AuthForm from "@/components/auth-form";

export const metadata: Metadata = { title: "Log in", robots: { index: false, follow: false } };

export default function LoginPage() {
  return <main className="simple-page"><header className="site-header"><Link href="/" className="brand"><span className="brand-mark">r</span>razy<span className="brand-period">.</span></Link><Link href="/explore" className="text-link">Explore projects</Link></header><section className="auth-panel"><div className="section-kicker">WELCOME BACK</div><h1>Good to see you.</h1><p>Log in to your RAZY account.</p><AuthForm mode="login" /><div className="auth-switch">New around here? <Link href="/register">Create an account</Link></div></section></main>;
}