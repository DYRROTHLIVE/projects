"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

export default function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(form.entries());
    try {
      const response = await fetch(`/api/auth/${mode}`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Unable to continue");
      router.push("/dashboard");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to continue");
    } finally { setBusy(false); }
  }
  return <form className="auth-form" onSubmit={submit}>
    {mode === "register" && <label>Your name<input name="displayName" autoComplete="name" required minLength={1} maxLength={80} /></label>}
    <label>Email address<input name="email" type="email" autoComplete="email" required maxLength={320} /></label>
    <label>Password<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={mode === "register" ? 12 : 1} maxLength={128} />{mode === "register" && <small>At least 12 characters with uppercase, lowercase, and a number.</small>}</label>
    {error && <p className="form-error" role="alert">{error}</p>}
    <button className="button button-dark auth-submit" disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</button>
  </form>;
}