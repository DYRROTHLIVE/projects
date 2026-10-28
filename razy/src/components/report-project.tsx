"use client";

import { useState, type FormEvent } from "react";

export default function ReportProject({ projectId }: { projectId: string }) {
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/reports", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...data, projectId }) });
    const result = await response.json();
    setMessage(response.ok ? "Thank you. Your report has been sent to the RAZY team." : result.error ?? "Unable to submit your report.");
    if (response.ok) event.currentTarget.reset();
  }
  return <details className="report-panel"><summary>Report a problem with this project</summary><form className="admin-form" onSubmit={submit}><label>Reason<input name="reason" required minLength={3} maxLength={120} /></label><label>Details<textarea name="details" maxLength={4000} /></label><button className="button button-dark">Send report</button></form>{message && <p role="status">{message}</p>}</details>;
}