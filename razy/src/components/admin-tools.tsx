"use client";

import { useState, type FormEvent } from "react";

type Category = { id: string; name: string; slug: string };
type User = { id: string; email: string; displayName: string; status: string; role: string; createdAt: string };
type Report = { id: string; reason: string; details: string | null; status: string; createdAt: string; user: { email: string } | null; project: { title: string; slug: string } | null };

export function CategoryManager({ categories }: { categories: Category[] }) {
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/admin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    const result = await response.json();
    setMessage(response.ok ? "Category added." : result.error);
    if (response.ok) location.reload();
  }
  return <div className="admin-columns"><section className="admin-card"><h2>Add category</h2><form className="admin-form" onSubmit={submit}><label>Name<input name="name" minLength={2} maxLength={80} required /></label><label>Slug<input name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" required /></label><button className="button button-dark">Add category</button></form>{message && <p role="status">{message}</p>}</section><section className="admin-card"><h2>Categories</h2><ul className="activity-list">{categories.map((category) => <li key={category.id}><strong>{category.name}</strong><span>/{category.slug}</span></li>)}</ul></section></div>;
}

export function UserSearch() {
  const [users, setUsers] = useState<User[]>([]);
  const [message, setMessage] = useState("");
  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const q = new FormData(event.currentTarget).get("q");
    const response = await fetch(`/api/admin?q=${encodeURIComponent(String(q ?? ""))}`);
    const data = await response.json();
    setUsers(data.users ?? []);
  }
  async function status(user: User, value: string) {
    const response = await fetch("/api/admin", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId: user.id, status: value }) });
    setMessage(response.ok ? `Account ${value.toLowerCase()}.` : "Unable to update account.");
    if (response.ok) setUsers(users.map((item) => item.id === user.id ? { ...item, status: value } : item));
  }
  return <><form className="admin-search" onSubmit={search}><input className="search-input" name="q" placeholder="Search by email or display name" required /><button>Search</button></form>{message && <p role="status">{message}</p>}<section className="admin-card"><ul className="admin-list">{users.map((user) => <li key={user.id}><div><strong>{user.displayName || user.email}</strong><span>{user.email} · {user.role} · {user.status}</span></div>{user.role !== "SUPER_ADMIN" && <div className="admin-actions">{user.status !== "SUSPENDED" ? <button onClick={() => status(user, "SUSPENDED")}>Suspend</button> : <button onClick={() => status(user, "ACTIVE")}>Reactivate</button>}</div>}</li>)}</ul>{!users.length && <p>Search for a user to begin.</p>}</section></>;
}

export function ReportManager({ reports }: { reports: Report[] }) {
  const [message, setMessage] = useState("");
  async function update(reportId: string, reportStatus: string) {
    const response = await fetch("/api/admin", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ reportId, reportStatus }) });
    setMessage(response.ok ? "Report updated." : "Unable to update report.");
    if (response.ok) location.reload();
  }
  return <><p role="status">{message}</p><section className="admin-card"><ul className="admin-list">{reports.map((report) => <li key={report.id}><div><strong>{report.reason} · {report.status}</strong><span>{report.project?.title ?? "Site report"} · {report.user?.email ?? "Anonymous"} · {report.createdAt}</span>{report.details && <span>{report.details}</span>}</div><div className="admin-actions"><button onClick={() => update(report.id, "REVIEWING")}>Review</button><button onClick={() => update(report.id, "RESOLVED")}>Resolve</button><button onClick={() => update(report.id, "REJECTED")}>Reject</button></div></li>)}</ul>{!reports.length && <p>No reports.</p>}</section></>;
}

export function SettingsForm({ site, seo }: { site: { announcement: string | null; adsEnabled: boolean; newsletterUrl: string | null } | null; seo: { defaultTitle: string; defaultDescription: string; canonicalBaseUrl: string } | null }) {
  const [message, setMessage] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const data = Object.fromEntries(form.entries());
    const response = await fetch("/api/admin", { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...data, adsEnabled: form.get("adsEnabled") === "on" }) });
    const result = await response.json();
    setMessage(response.ok ? "Settings saved." : result.error ?? "Unable to save settings.");
  }
  return <><form className="admin-form admin-card" onSubmit={submit}><h2>Site and SEO settings</h2><label>Announcement<textarea name="announcement" maxLength={500} defaultValue={site?.announcement ?? ""} /></label><label className="checkbox-row"><input type="checkbox" name="adsEnabled" defaultChecked={site?.adsEnabled ?? false} /> Enable campaign placements</label><label>Newsletter URL<input name="newsletterUrl" type="url" defaultValue={site?.newsletterUrl ?? ""} /></label><label>Default SEO title<input name="defaultTitle" maxLength={120} defaultValue={seo?.defaultTitle ?? "RAZY — Good projects. Good people."} /></label><label>Default SEO description<textarea name="defaultDescription" maxLength={320} defaultValue={seo?.defaultDescription ?? "A home for the things people make."} /></label><label>Canonical base URL<input name="canonicalBaseUrl" type="url" required defaultValue={seo?.canonicalBaseUrl ?? ""} /></label><button className="button button-dark">Save settings</button></form>{message && <p role="status">{message}</p>}</>;
}

export function UploadPanel() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const file = (new FormData(form).get("file") as File | null);
    if (!file) return;
    setBusy(true);
    setMessage("");
    try {
      const ticketResponse = await fetch("/api/uploads", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }) });
      const ticket = await ticketResponse.json();
      if (!ticketResponse.ok) throw new Error(ticket.error ?? "Unable to start upload.");
      const putResponse = await fetch(ticket.uploadUrl, { method: "PUT", headers: { "content-type": file.type }, body: file });
      if (!putResponse.ok) throw new Error("Object storage rejected the upload.");
      const finalizeResponse = await fetch("/api/uploads/finalize", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ key: ticket.key, name: file.name, size: file.size, contentType: file.type }) });
      const result = await finalizeResponse.json();
      if (!finalizeResponse.ok) throw new Error(result.error ?? "Unable to verify upload.");
      setMessage(`File stored in quarantine (${result.file.id}). It cannot be attached to a published project until malware scanning is configured and passes.`);
      form.reset();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Upload failed.");
    } finally { setBusy(false); }
  }
  return <section className="admin-card"><h2>Upload to quarantine</h2><p>APK, ZIP, PNG, JPEG, WebP, or PDF · maximum 2 GB. Signature checks run before a quarantined record is created. Malware scanning is required before publication.</p><form className="admin-form" onSubmit={submit}><label>Choose a file<input name="file" type="file" accept=".apk,.zip,.png,.jpg,.jpeg,.webp,.pdf" required /></label><button className="button button-dark" disabled={busy}>{busy ? "Uploading…" : "Upload and verify"}</button></form>{message && <p role="status" className="form-notice">{message}</p>}</section>;
}

export function CampaignManager({ campaigns }: { campaigns: Array<{ id: string; name: string; status: string; startsAt: string; endsAt: string; sponsor: { name: string } }> }) {
  const [message, setMessage] = useState("");
  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch("/api/admin", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    const result = await response.json();
    setMessage(response.ok ? "Paused campaign created." : result.error ?? "Unable to create campaign.");
    if (response.ok) location.reload();
  }
  async function status(campaignId: string, campaignStatus: string) {
    const response = await fetch("/api/admin", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ campaignId, campaignStatus }) });
    const result = await response.json();
    setMessage(response.ok ? `Campaign ${campaignStatus.toLowerCase()}.` : result.error ?? "Unable to update campaign.");
    if (response.ok) location.reload();
  }
  return <div className="admin-columns"><section className="admin-card"><h2>New sponsor campaign</h2><form className="admin-form" onSubmit={create}><label>Sponsor<input name="sponsorName" required maxLength={120} /></label><label>Secure destination URL<input type="url" name="destination" required pattern="https://.*" /></label><label>Campaign name<input name="campaignName" required maxLength={120} /></label><label>Starts<input name="startsAt" type="datetime-local" required /></label><label>Ends<input name="endsAt" type="datetime-local" required /></label><label>Placement<select name="placement"><option>BANNER</option><option>HOMEPAGE_FEATURE</option><option>PROJECT_PAGE</option><option>CATEGORY</option></select></label><button className="button button-dark">Create paused campaign</button></form></section><section className="admin-card"><h2>Campaigns</h2><ul className="admin-list">{campaigns.map((campaign) => <li key={campaign.id}><div><strong>{campaign.name}</strong><span>{campaign.sponsor.name} · {campaign.status} · {campaign.startsAt} – {campaign.endsAt}</span></div><div className="admin-actions">{campaign.status !== "ACTIVE" && <button onClick={() => status(campaign.id, "ACTIVE")}>Activate</button>}{campaign.status !== "PAUSED" && <button onClick={() => status(campaign.id, "PAUSED")}>Pause</button>}{campaign.status !== "ENDED" && <button onClick={() => status(campaign.id, "ENDED")}>End</button>}</div></li>)}</ul>{!campaigns.length && <p>No sponsor campaigns.</p>}</section>{message && <p role="status" className="form-notice">{message}</p>}</div>;
}

export function ScannerGate({ files }: { files: Array<{ id: string; name: string; status: string }> }) {
  const [message, setMessage] = useState("");
  async function approve(fileId: string) {
    const response = await fetch("/api/admin", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ fileId, scanStatus: "CLEAN" }) });
    const data = await response.json();
    setMessage(response.ok ? "File approved and published." : data.error ?? "File cannot be approved.");
    if (response.ok) location.reload();
  }
  return <section className="admin-card"><h2>Scanner approval</h2><p>No file is promoted by signature checks alone. Approval is blocked until a real malware scanner adapter is configured.</p><ul className="admin-list">{files.filter((file) => file.status === "PENDING").map((file) => <li key={file.id}><div><strong>{file.name}</strong><span>Quarantined · awaiting security scan</span></div><div className="admin-actions"><button onClick={() => approve(file.id)}>Approve clean scan</button></div></li>)}</ul>{message && <p role="status">{message}</p>}</section>;
}