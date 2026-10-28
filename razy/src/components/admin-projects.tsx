"use client";

import { useState, type FormEvent } from "react";

type Category = { id: string; name: string };
type Project = { id: string; title: string; slug: string; status: string; shortDescription: string; description: string; type: string; categoryId: string; developer: string | null; requirements: string | null; license: string | null; seoTitle: string | null; seoDescription: string | null; demoUrl: string | null };
type StoredFile = { id: string; originalName: string; contentType: string; sizeBytes: string };

export default function AdminProjects({ categories, projects, files }: { categories: Category[]; projects: Project[]; files: StoredFile[] }) {
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<Project | null>(null);
  async function changeStatus(id: string, status: string) {
    const response = await fetch(`/api/projects/${id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status }) });
    setMessage(response.ok ? `Project ${status.toLowerCase()}.` : "Unable to change project status.");
    if (response.ok) location.reload();
  }
  async function remove(id: string) {
    if (!confirm("Permanently delete this project?")) return;
    const response = await fetch(`/api/projects/${id}`, { method: "DELETE" });
    setMessage(response.ok ? "Project deleted." : "Unable to delete this project; linked history may exist.");
    if (response.ok) location.reload();
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    const response = await fetch(editing ? `/api/projects/${editing.id}` : "/api/projects", { method: editing ? "PATCH" : "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    const result = await response.json();
    setMessage(response.ok ? editing ? "Project updated." : "Draft created." : result.error ?? "Unable to save project.");
    if (response.ok) location.reload();
  }
  return <div className="admin-columns"><section className="admin-card"><h2>{editing ? "Edit project" : "New draft"}</h2><form className="admin-form" key={editing?.id ?? "new"} onSubmit={save}><label>Project title<input name="title" minLength={3} maxLength={120} defaultValue={editing?.title ?? ""} required /></label><label>Slug<input name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" defaultValue={editing?.slug ?? ""} required /></label><label>Short description<textarea name="shortDescription" minLength={20} maxLength={240} defaultValue={editing?.shortDescription ?? ""} required /></label><label>Full description<textarea name="description" minLength={40} maxLength={20000} defaultValue={editing?.description ?? ""} required /></label><label>Category<select name="categoryId" defaultValue={editing?.categoryId ?? categories[0]?.id} required>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></label><label>Type<select name="type" defaultValue={editing?.type ?? "APP"}><option>APP</option><option>APK</option><option>ZIP</option><option>SOURCE_CODE</option><option>WEBSITE</option><option>GAME</option><option>OTHER</option></select></label><label>Developer<input name="developer" maxLength={120} defaultValue={editing?.developer ?? ""} /></label><label>Demo URL<input name="demoUrl" type="url" defaultValue={editing?.demoUrl ?? ""} /></label><label>Requirements<textarea name="requirements" maxLength={2000} defaultValue={editing?.requirements ?? ""} /></label><label>License<input name="license" maxLength={120} defaultValue={editing?.license ?? ""} /></label><label>SEO title<input name="seoTitle" maxLength={120} defaultValue={editing?.seoTitle ?? ""} /></label><label>SEO description<textarea name="seoDescription" maxLength={320} defaultValue={editing?.seoDescription ?? ""} /></label><label>Release version<input name="version" maxLength={40} defaultValue="1.0.0" /></label>{files.length > 0 ? <label>Scanned published file<select name="storedFileId" defaultValue=""><option value="">No file</option>{files.map((file) => <option key={file.id} value={file.id}>{file.originalName} · {file.contentType} · {(Number(file.sizeBytes) / 1024 / 1024).toFixed(1)} MB</option>)}</select></label> : <p>No files have passed malware scanning and publication checks yet. Uploads remain quarantined.</p>}<button className="button button-dark">{editing ? "Save changes" : "Save draft"}</button>{editing && <button type="button" className="filter-chip" onClick={() => setEditing(null)}>Cancel edit</button>}</form></section><section className="admin-card"><h2>Projects</h2>{projects.length ? <ul className="admin-list">{projects.map((project) => <li key={project.id}><div><strong>{project.title}</strong><span>/{project.slug} · {project.status}</span></div><div className="admin-actions"><button onClick={() => setEditing(project)}>Edit</button>{project.status !== "PUBLISHED" && <button onClick={() => changeStatus(project.id, "PUBLISHED")}>Publish</button>}{project.status !== "DRAFT" && <button onClick={() => changeStatus(project.id, "DRAFT")}>Draft</button>}{project.status !== "ARCHIVED" && <button onClick={() => changeStatus(project.id, "ARCHIVED")}>Archive</button>}<button onClick={() => remove(project.id)}>Delete</button></div></li>)}</ul> : <p>No projects in the database.</p>}</section>{message && <p role="status" className="form-notice">{message}</p>}</div>;
}