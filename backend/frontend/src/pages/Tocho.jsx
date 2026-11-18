import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getAuthenticatedHeaders } from "../utils/portalTest";

const active = new Set(["scanning", "routing"]);
const labels = { uploading: "Uploading", scanning: "Scanning", routing: "Sorting content", failed: "Needs attention", complete: "Complete" };
const fields = { subject: "Subject", classLevel: "Class", exam: "Preparation" };
const input = "w-full rounded-lg border border-slate-300 bg-transparent p-2 dark:border-slate-600";
const button = "rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-50 dark:border-slate-600";
const panel = "space-y-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900";

async function api(path, options = {}) {
  const headers = getAuthenticatedHeaders(options.body instanceof FormData || !options.body ? {} : { "Content-Type": "application/json" });
  const response = await fetch("/api/tocho" + path, { ...options, headers });
  if (response.status === 204) return {};
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw Object.assign(new Error(data.message || "Tocho could not complete this request."), { status: response.status });
  return data;
}

async function fileFingerprint(file, size) {
  const parts = [];
  for (let offset = 0; offset < file.size; offset += size) {
    parts.push(new Uint8Array(await crypto.subtle.digest("SHA-256", await file.slice(offset, offset + size).arrayBuffer())));
  }
  const hashes = new Uint8Array(parts.length * 32);
  parts.forEach((part, index) => hashes.set(part, index * 32));
  const hash = await crypto.subtle.digest("SHA-256", hashes);
  return Array.from(new Uint8Array(hash), value => value.toString(16).padStart(2, "0")).join("");
}

export default function Tocho() {
  const [config, setConfig] = useState(null);
  const [file, setFile] = useState(null);
  const [title, setTitle] = useState("");
  const [hints, setHints] = useState({ subject: "", classLevel: "", exam: "" });
  const [jobs, setJobs] = useState([]);
  const [selected, setSelected] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState("");
  const [unit, setUnit] = useState(1);
  const [review, setReview] = useState(null);
  const job = jobs.find(item => item._id === selected);
  const isActive = active.has(job?.status);
  const setJob = current => setJobs(previous => [current, ...previous.filter(item => item._id !== current._id)]);

  useEffect(() => {
    Promise.all([api("/config"), api("/jobs")]).then(([settings, history]) => {
      setConfig(settings);
      setJobs(history.jobs);
      setSelected(history.jobs[0]?._id || "");
    }).catch(failure => setError(failure.message));
  }, []);

  useEffect(() => {
    if (!selected || !isActive) return;
    let stopped = false;
    let timer;
    const poll = async () => {
      try {
        const data = await api(`/jobs/${selected}`);
        if (!stopped) setJob(data.job);
      } catch (failure) {
        if (!stopped) setError(failure.message);
      } finally {
        if (!stopped) timer = setTimeout(poll, 4000);
      }
    };
    timer = setTimeout(poll, 4000);
    return () => { stopped = true; clearTimeout(timer); };
  }, [selected, isActive]);

  async function start(id) {
    const data = await api(`/jobs/${id}/start`, { method: "POST" });
    setJob(data.job);
  }

  async function upload(event) {
    event.preventDefault();
    if (!file || !config || uploadStatus) return;
    setError("");
    if (!/\.(pdf|docx)$/i.test(file.name) || file.size > config.maxBytes) {
      setError("Choose a PDF or Word (.docx) file up to 250 MB.");
      return;
    }
    setUploadStatus("Checking the book file…");
    try {
      const fingerprint = await fileFingerprint(file, config.chunkBytes);
      const data = await api("/jobs", { method: "POST", body: JSON.stringify({ fileName: file.name, size: file.size, title, hints, fingerprint }) });
      let current = data.job;
      setJob(current);
      setSelected(current._id);
      setReview(null);
      if (current.status === "uploading") {
        const done = new Set(current.uploadedParts);
        for (let part = 0; part < current.partCount; part++) {
          if (done.has(part)) continue;
          setUploadStatus(`Uploading part ${part + 1} of ${current.partCount}…`);
          const form = new FormData();
          form.append("part", file.slice(part * config.chunkBytes, (part + 1) * config.chunkBytes), "book-part");
          await api(`/jobs/${current._id}/parts/${part}`, { method: "PUT", body: form });
          done.add(part);
          setJob({ ...current, uploadedParts: [...done] });
        }
      }
      if (current.status !== "complete" && !active.has(current.status)) await start(current._id);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setUploadStatus("");
    }
  }

  async function resume() {
    if (!job || starting) return;
    setError("");
    setStarting(true);
    try { await start(job._id); } catch (failure) { setError(failure.message); }
    finally { setStarting(false); }
  }

  async function readReview(event) {
    event.preventDefault();
    setError("");
    setReview(null);
    try {
      const data = await api(`/jobs/${job._id}/review?unit=${Number(unit)}`);
      setReview({ id: job._id, unit, items: data.items });
    } catch (failure) { setError(failure.message); }
  }

  const scannedLabel = job?.format === "pdf" ? "pages" : "text sections";
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-4 text-slate-900 dark:text-slate-100 sm:p-6">
      <header>
        <h1 className="text-3xl font-bold">Tocho</h1>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Scan a book into question drafts and one set of Study Notes.</p>
      </header>
      <div className="grid items-start gap-5 lg:grid-cols-2">
        <form className={panel} onSubmit={upload}>
          <h2 className="text-xl font-bold">Upload a book</h2>
          <fieldset className="space-y-4" disabled={Boolean(uploadStatus) || !config}>
            <label className="block space-y-1"><span className="text-sm font-semibold">PDF or Word file</span>
              <input type="file" className={input} accept=".pdf,.docx" required onChange={event => {
                const chosen = event.target.files[0];
                setFile(chosen || null);
                setTitle(chosen?.name.replace(/\.(pdf|docx)$/i, "").slice(0, 160) || "");
              }} />
            </label>
            <p className="text-sm text-slate-600 dark:text-slate-300">Up to 250 MB. Upload a PDF or Word (.docx) book. Use PDF when the exact page layout matters.</p>
            <label className="block space-y-1"><span className="text-sm font-semibold">Book title</span>
              <input className={input} value={title} onChange={event => setTitle(event.target.value)} maxLength={160} required />
            </label>
            <fieldset className="grid gap-2 sm:grid-cols-3">
              <legend className="mb-2 text-sm font-semibold">Curriculum hints (optional)</legend>
              {Object.entries({ subject: config?.subjects, classLevel: config?.classes, exam: config?.exams }).map(([key, values]) => (
                <label className="space-y-1 text-sm" key={key}><span>{fields[key]}</span>
                  <select className={input} value={hints[key]} onChange={event => setHints({ ...hints, [key]: event.target.value })}>
                    <option value="">Auto detect</option>
                    {(values || []).map(value => <option key={value}>{value}</option>)}
                  </select>
                </label>
              ))}
            </fieldset>
            <button className="rounded-lg bg-indigo-700 px-4 py-2.5 font-semibold text-white disabled:opacity-50" disabled={!file}>Upload and scan</button>
          </fieldset>
          {uploadStatus && <p role="status" className="text-sm">{uploadStatus}</p>}
        </form>
        <section className={panel}>
          <h2 className="text-xl font-bold">Book imports</h2>
          {!jobs.length && <p className="text-sm">Uploaded books appear here.</p>}
          {jobs.length > 0 && (
            <label className="block space-y-1"><span className="text-sm font-semibold">Book</span>
              <select className={input} value={selected} onChange={event => { setSelected(event.target.value); setUnit(1); setReview(null); }}>
                {jobs.map(entry => <option key={entry._id} value={entry._id}>{entry.title} · {labels[entry.status]}</option>)}
              </select>
            </label>
          )}
          {job && (
            <div className="space-y-3">
              <p role="status" className="font-semibold">{labels[job.status]}</p>
              {job.total > 0 && (
                <div><progress className="w-full" value={job.scanned} max={job.total} aria-label="Book scan progress" />
                  <p className="text-sm">{job.scanned} of {job.total} {scannedLabel} scanned</p></div>
              )}
              {job.status === "uploading" && (
                <p className="text-sm">{job.uploadedParts?.length || 0} of {job.partCount} upload parts stored. Select the same file and title to resume an interrupted upload.</p>
              )}
              {job.error && <p className="text-sm text-rose-700 dark:text-rose-300">{job.error}</p>}
              {(job.status === "failed" || (job.status === "uploading" && job.uploadedParts?.length === job.partCount) ||
                (isActive && Date.parse(job.leaseUntil) < Date.now())) && (
                <button type="button" className={button} disabled={starting || Boolean(uploadStatus)} onClick={resume}>Resume scan</button>
              )}
              {job.status === "complete" && (
                <>
                  <dl className="grid grid-cols-2 gap-3 text-sm">
                    {Object.entries({ questionCount: "Question drafts", matchedCount: "Solutions matched", notesCount: "Study sections", reviewCount: "Items to review" }).map(([key, label]) => (
                      <div className="rounded-lg bg-slate-100 p-3 dark:bg-slate-800" key={key}><dt>{label}</dt><dd className="text-lg font-bold">{job[key]}</dd></div>
                    ))}
                  </dl>
                  <div className="flex flex-wrap gap-3 text-sm font-semibold">
                    <Link className={button} to={`/admin/navta-test?bookImport=${job._id}#navta-question-bank-results`}>Open question drafts</Link>
                    {job.notesCount > 0 && <Link className={button} to={`/notes?book=${job._id}`}>Open book notes</Link>}
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      </div>
      {error && <p role="alert" className="text-sm font-semibold text-rose-700 dark:text-rose-300">{error}</p>}
      {job?.scanned > 0 && (
        <section className={panel}>
          <h2 className="text-xl font-bold">Review scanned content</h2>
          <form className="flex flex-wrap items-end gap-3" onSubmit={readReview}>
            <label className="space-y-1 text-sm"><span>{job.format === "pdf" ? "Source page" : "Source section"}</span>
              <input type="number" min="1" max={job.scanned} value={unit} onChange={event => setUnit(event.target.value)} required className={input} />
            </label>
            <button className={button}>View content</button>
          </form>
          {review?.id === job._id && (
            <div className="space-y-3">
              <h3 className="font-semibold">{job.format === "pdf" ? "Page" : "Section"} {review.unit}</h3>
              {review.items.length === 0 && <p className="text-sm">No study material, questions or solutions were found here.</p>}
              {review.items.map(item => (
                <article className="space-y-2 rounded-lg border border-slate-200 p-3 dark:border-slate-700" key={item._id}>
                  <h4 className="capitalize text-sm font-bold">{item.kind}{item.number && ` ${item.number}`}{item.scope && ` · ${item.scope}`}</h4>
                  <p className="whitespace-pre-wrap break-words text-sm">{item.text}</p>
                  {item.image?.url && <img className="max-h-80 max-w-full object-contain" src={item.image.url} alt={item.image.altText} loading="lazy" />}
                  {item.options?.length > 0 && <ol type="A" className="ml-5 list-[upper-alpha] text-sm">{item.options.map((option, index) => <li key={index}>{option}</li>)}</ol>}
                  {(item.warning || (item.kind === "question" && !item.classification)) && <p className="text-sm text-amber-800 dark:text-amber-300">{item.warning || "Needs manual classification before it can enter the question bank."}</p>}
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </main>
  );
}
