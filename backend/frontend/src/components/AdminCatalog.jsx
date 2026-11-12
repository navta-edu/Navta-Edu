import { useEffect, useState } from 'react';
import { adminAPI } from '../utils/api';
import AdminPagination from './AdminPagination';
import Button from './Button';
import Card from './Card';

const fieldClass = 'w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-800 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100';
const labelClass = 'grid gap-1 text-sm font-semibold text-slate-700 dark:text-slate-300';
const emptyPaper = { subjectId: '', chapterId: '', title: '', examName: '', year: '', pdfUrl: '' };
const emptyReward = { title: '', description: '', costCoins: '', type: 'badge', badgeImage: 'star' };

export default function AdminCatalog({ kind, subjects = [] }) {
  const isPaper = kind === 'pyq';
  const singular = isPaper ? 'paper' : 'reward';
  const emptyForm = isPaper ? emptyPaper : emptyReward;
  const listItems = isPaper ? adminAPI.getPYQs : adminAPI.getRewards;
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState('');
  const [chapters, setChapters] = useState([]);
  const [chaptersLoading, setChaptersLoading] = useState(false);
  const [chapterError, setChapterError] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [records, setRecords] = useState([]);
  const [paging, setPaging] = useState(null);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const subjectId = isPaper ? form.subjectId : '';

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setListError('');
    listItems({ status, page, limit: 20 }, controller.signal)
      .then((response) => {
        if (controller.signal.aborted) return;
        setRecords(response.data);
        setPaging(response.pagination);
      })
      .catch(() => {
        if (!controller.signal.aborted) setListError('Unable to load the catalogue.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [listItems, page, revision, status]);

  useEffect(() => {
    if (!subjectId) return;

    const controller = new AbortController();
    setChapters([]);
    setChapterError('');
    setChaptersLoading(true);
    adminAPI.getChapters({ subject: subjectId }, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) setChapters(response.data);
      })
      .catch(() => {
        if (!controller.signal.aborted) setChapterError('Unable to load chapters for this subject.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setChaptersLoading(false);
      });
    return () => controller.abort();
  }, [subjectId]);

  const updateField = (name, value) => {
    setForm((current) => name === 'subjectId'
      ? { ...current, subjectId: value, chapterId: '' }
      : { ...current, [name]: value });
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId('');
    setError('');
  };

  const edit = (item) => {
    setEditingId(item._id);
    setMessage('');
    setError('');
    if (isPaper) {
      setForm({
        subjectId: item.subject?._id || '',
        chapterId: item.chapter?._id || '',
        title: item.title,
        examName: item.examName,
        year: String(item.year),
        pdfUrl: item.pdfUrl || ''
      });
    } else {
      setForm({
        title: item.title,
        description: item.description,
        costCoins: String(item.costCoins),
        type: item.type || 'badge',
        badgeImage: item.badgeImage || 'award'
      });
    }
  };

  const refresh = () => {
    setRevision((current) => current + 1);
  };

  const save = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');
    setMessage('');
    try {
      if (editingId) {
        const update = isPaper ? adminAPI.updatePYQ : adminAPI.updateReward;
        await update(editingId, form);
      } else {
        const create = isPaper ? adminAPI.createPYQ : adminAPI.createReward;
        await create(form);
        setStatus('all');
        setPage(1);
      }
      resetForm();
      setMessage(editingId ? 'Changes saved.' : isPaper ? 'Paper added.' : 'Reward added.');
      refresh();
    } catch (failure) {
      setError(failure.response?.data?.message || 'Unable to save the item.');
    } finally {
      setBusy(false);
    }
  };

  const archive = async (item) => {
    setBusy(true);
    setError('');
    setMessage('');
    try {
      const setArchived = isPaper ? adminAPI.setPYQArchived : adminAPI.setRewardArchived;
      await setArchived(item._id, !item.archivedAt);
      setMessage(item.archivedAt ? 'Item restored.' : 'Item archived.');
      refresh();
    } catch (failure) {
      setError(failure.response?.data?.message || 'Unable to change the archive status.');
    } finally {
      setBusy(false);
    }
  };

  const currentSubject = subjects.find((subject) => (subject._id || subject.id) === subjectId);
  const chapterOptions = subjectId ? chapters : [];
  const badgeIcons = ['star', 'crown', 'award'];

  return (
    <div className="grid gap-6 xl:grid-cols-2">
      <Card title={editingId ? (isPaper ? 'Edit PYQ' : 'Edit reward') : (isPaper ? 'Upload PYQ Paper' : 'Create reward')}>
        <form onSubmit={save} className="grid gap-4">
          <label className={labelClass}>
            Title
            <input required className={fieldClass} value={form.title} onChange={(event) => updateField('title', event.target.value)} />
          </label>
          {isPaper ? (
            <>
              <label className={labelClass}>
                Subject
                <select required className={fieldClass} value={subjectId} onChange={(event) => updateField('subjectId', event.target.value)}>
                  <option value="">Select subject</option>
                  {subjectId && !currentSubject && <option value={subjectId}>Current subject</option>}
                  {subjects.map((subject) => (
                    <option key={subject._id || subject.id} value={subject._id || subject.id}>{subject.name}</option>
                  ))}
                </select>
              </label>
              <label className={labelClass}>
                Chapter
                <select disabled={!subjectId || chaptersLoading} className={fieldClass} value={form.chapterId} onChange={(event) => updateField('chapterId', event.target.value)}>
                  <option value="">{subjectId && chaptersLoading ? 'Loading chapters…' : 'None'}</option>
                  {form.chapterId && !chapterOptions.some((chapter) => chapter._id === form.chapterId) && (
                    <option value={form.chapterId}>Current chapter</option>
                  )}
                  {chapterOptions.map((chapter) => (
                    <option key={chapter._id} value={chapter._id}>
                      {chapter.title}{chapter.classLevel ? ` (${chapter.classLevel}, ${chapter.examination})` : ''}
                    </option>
                  ))}
                </select>
              </label>
              {subjectId && chapterError && <p role="alert" className="text-sm text-red-600">{chapterError}</p>}
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={labelClass}>
                  Exam year
                  <input required type="number" min="1" max="9999" className={fieldClass} value={form.year} onChange={(event) => updateField('year', event.target.value)} />
                </label>
                <label className={labelClass}>
                  Exam name
                  <input required className={fieldClass} value={form.examName} onChange={(event) => updateField('examName', event.target.value)} />
                </label>
              </div>
              <label className={labelClass}>
                PDF URL
                <input required={!editingId} type="url" className={fieldClass} value={form.pdfUrl} onChange={(event) => updateField('pdfUrl', event.target.value)} />
              </label>
            </>
          ) : (
            <>
              <label className={labelClass}>
                Description
                <textarea required rows={3} className={fieldClass} value={form.description} onChange={(event) => updateField('description', event.target.value)} />
              </label>
              <label className={labelClass}>
                Coin cost
                <input required type="number" min="0" step="any" className={fieldClass} value={form.costCoins} onChange={(event) => updateField('costCoins', event.target.value)} />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className={labelClass}>
                  Type
                  <select className={fieldClass} value={form.type} onChange={(event) => updateField('type', event.target.value)}>
                    <option value="badge">Badge</option>
                    <option value="coupon">Coupon</option>
                    <option value="resource">Resource</option>
                  </select>
                </label>
                <label className={labelClass}>
                  Icon
                  <select className={fieldClass} value={form.badgeImage} onChange={(event) => updateField('badgeImage', event.target.value)}>
                    {!badgeIcons.includes(form.badgeImage) && <option value={form.badgeImage}>Current icon</option>}
                    {badgeIcons.map((icon) => <option key={icon} value={icon}>{icon}</option>)}
                  </select>
                </label>
              </div>
            </>
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy || (isPaper && (!subjectId || chaptersLoading))}>
              {editingId ? 'Save changes' : isPaper ? 'Add paper' : 'Create reward'}
            </Button>
            {editingId && <Button variant="secondary" disabled={busy} onClick={resetForm}>Cancel edit</Button>}
          </div>
        </form>
      </Card>
      <Card title={isPaper ? 'PYQ catalogue' : 'Reward catalogue'}>
        <label className={labelClass}>
          Status
          <select className={fieldClass} value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }}>
            <option value="all">All</option>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        {message && <p role="status" className="mt-3 text-sm text-emerald-600 dark:text-emerald-400">{message}</p>}
        {error && <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}
        {loading ? (
          <p role="status" className="mt-4 text-sm text-slate-500">Loading…</p>
        ) : listError ? (
          <div className="mt-4 grid justify-items-start gap-2">
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">{listError}</p>
            <Button variant="secondary" onClick={() => setRevision((current) => current + 1)}>Retry</Button>
          </div>
        ) : records.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">No items with this status.</p>
        ) : (
          <ul className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
            {records.map((item) => (
              <li key={item._id} className="py-3">
                <p className="break-words font-semibold text-slate-800 dark:text-slate-100">{item.title}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {isPaper
                    ? [item.examName, item.year, item.subject?.name, item.chapter?.title].filter(Boolean).join(' · ')
                    : `${item.costCoins} coins · ${item.type || 'badge'}`}
                  {' · '}{item.archivedAt ? 'Archived' : 'Active'}
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Button variant="secondary" disabled={busy} onClick={() => edit(item)}>Edit {singular}</Button>
                  <Button variant="outline" disabled={busy} onClick={() => archive(item)}>
                    {item.archivedAt ? 'Restore' : 'Archive'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
        <AdminPagination pagination={paging} loading={loading || busy} onPageChange={setPage} />
      </Card>
    </div>
  );
}
