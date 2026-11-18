import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { getAuthenticatedHeaders } from "../utils/portalTest";

const root = "/api/content/book-notes";
const button = "rounded-lg border border-slate-300 px-3 py-2 text-sm font-semibold disabled:opacity-50 dark:border-slate-700";

async function read(path, signal) {
  const res = await fetch(root + path, { signal, headers: getAuthenticatedHeaders() });
  if (!res.ok) throw new Error("Book notes could not be loaded.");
  return res;
}

export default function BookNotes() {
  const [params] = useSearchParams();
  const bookId = params.get("book");
  const [catalogPage, setCatalogPage] = useState(1);
  const [sectionPage, setSectionPage] = useState(1);
  const [catalog, setCatalog] = useState(null);
  const [selection, setSelection] = useState(null);
  const [error, setError] = useState("");
  const [downloading, setDownloading] = useState(false);
  const page = bookId ? sectionPage : catalogPage;

  useEffect(() => {
    setSectionPage(1);
    setSelection(null);
  }, [bookId]);

  useEffect(() => {
    const controller = new AbortController();
    setError("");
    read(bookId ? `/${encodeURIComponent(bookId)}?page=${page}` : `?page=${page}`, controller.signal)
      .then(res => res.json())
      .then(data => {
        if (controller.signal.aborted) return;
        if (bookId) setSelection({ ...data, page });
        else setCatalog(data);
      })
      .catch(failure => { if (!controller.signal.aborted) setError(failure.message); });
    return () => controller.abort();
  }, [bookId, page]);

  async function download() {
    setDownloading(true);
    setError("");
    let url;
    try {
      const res = await read(`/${encodeURIComponent(bookId)}/download`);
      url = URL.createObjectURL(await res.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = selection.book.title.replace(/[<>:"/\\|?*]/g, "_") + ".txt";
      link.click();
    } catch (failure) { setError(failure.message); }
    finally {
      if (url) setTimeout(() => URL.revokeObjectURL(url), 1000);
      setDownloading(false);
    }
  }

  if (!bookId && !catalog?.books.length && !error) return null;
  return (
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 text-slate-900 dark:border-slate-800 dark:bg-slate-900 dark:text-white">
      {bookId ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link className={button} to="/notes">All book notes</Link>
            {selection?.book._id === bookId && <button type="button" className={button} disabled={downloading} onClick={download}>{downloading ? "Downloading…" : "Download notes (.txt)"}</button>}
          </div>
          {selection?.book._id === bookId && (
            <>
              <h2 className="text-2xl font-bold">{selection.book.title}</h2>
              {selection.page !== sectionPage ? <p role="status">Loading sections…</p> : (
                <div className="space-y-5">
                  {selection.sections.map((section, index) => (
                    <article key={`${section.unit}-${index}`} className="space-y-2 border-t border-slate-200 pt-4 dark:border-slate-700">
                      <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">Source {section.unit}{section.scope && ` · ${section.scope}`}</p>
                      <p className="whitespace-pre-wrap break-words leading-relaxed">{section.text}</p>
                      {section.image?.url && <img loading="lazy" src={section.image.url} alt={section.image.altText} className="max-h-96 max-w-full object-contain" />}
                    </article>
                  ))}
                  {(sectionPage > 1 || selection.hasMore) && (
                    <nav aria-label="Book study sections" className="flex justify-between gap-3">
                      <button className={button} disabled={sectionPage === 1} onClick={() => setSectionPage(sectionPage - 1)}>Previous sections</button>
                      <button className={button} disabled={!selection.hasMore} onClick={() => setSectionPage(sectionPage + 1)}>Next sections</button>
                    </nav>
                  )}
                </div>
              )}
            </>
          )}
          {!selection && !error && <p role="status">Loading book…</p>}
        </>
      ) : (
        <>
          <h2 className="text-xl font-bold">Book notes</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {catalog?.books.map(book => (
              <li key={book._id}>
                <Link className="block rounded-lg border border-slate-200 p-3 font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800" to={`/notes?book=${book._id}`}>
                  {book.title}
                  <span className="block text-xs font-normal opacity-75">{[book.subjectName, book.className, book.exam].filter(Boolean).join(" · ")}</span>
                </Link>
              </li>
            ))}
          </ul>
          {catalog?.pages > 1 && (
            <nav aria-label="Book notes pages" className="flex justify-between gap-3">
              <button className={button} disabled={catalogPage === 1} onClick={() => setCatalogPage(catalogPage - 1)}>Previous books</button>
              <button className={button} disabled={catalogPage >= catalog.pages} onClick={() => setCatalogPage(catalogPage + 1)}>Next books</button>
            </nav>
          )}
        </>
      )}
      {error && <p role="alert" className="text-sm text-rose-700 dark:text-rose-300">{error}</p>}
    </section>
  );
}
