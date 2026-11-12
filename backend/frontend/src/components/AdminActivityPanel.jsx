import { useEffect, useState } from 'react';
import { adminAPI } from '../utils/api';
import AdminPagination from './AdminPagination';
import Button from './Button';
import Card from './Card';

export default function AdminActivityPanel() {
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [activity, setActivity] = useState({ data: [], pagination: null });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    adminAPI.getActivity({ page, limit: 25 }, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) setActivity(response);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError('Unable to load admin activity.');
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [page, revision]);

  return (
    <Card title="Admin Activity" action={
      <Button variant="secondary" disabled={loading} onClick={() => setRevision((current) => current + 1)}>Refresh</Button>
    }>
      {loading ? (
        <p role="status" className="text-sm text-slate-500">Loading admin activity…</p>
      ) : error ? (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">{error}</p>
      ) : activity.data.length ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr>
                <th scope="col" className="py-2 pr-4">Time</th>
                <th scope="col" className="py-2 pr-4">Admin</th>
                <th scope="col" className="py-2 pr-4">Action</th>
                <th scope="col" className="py-2 pr-4">Record</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {activity.data.map((item) => (
                <tr key={item._id}>
                  <td className="whitespace-nowrap py-3 pr-4"><time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time></td>
                  <td className="py-3 pr-4">{item.actorName}</td>
                  <td className="py-3 pr-4">{item.action}</td>
                  <td className="py-3 pr-4">
                    {item.resource}
                    <span className="block text-xs text-slate-500">{item.resourceId}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-sm text-slate-500">No admin activity has been recorded yet.</p>
      )}
      <AdminPagination pagination={activity.pagination} loading={loading} onPageChange={setPage} />
    </Card>
  );
}
