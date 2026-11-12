import React, { useState } from 'react';
import { ArrowLeft, Briefcase, GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { setPortalTestRole } from '../utils/portalTest';

const portals = [
  { role: 'student', name: 'Student', path: '/dashboard', Icon: GraduationCap },
  { role: 'teacher', name: 'Educator', path: '/teacher', Icon: Briefcase }
];

export function PortalTestSwitches() {
  const { user } = useAuth();
  const [opening, setOpening] = useState(null);
  const [error, setError] = useState('');

  if (user?.role !== 'admin') return null;

  async function openPortal(portal) {
    setOpening(portal.role);
    setError('');
    try {
      const response = await authAPI.startPortalTest(portal.role);
      if (!response.success || response.role !== portal.role) {
        throw new Error('The test profile could not be prepared.');
      }
      setPortalTestRole(portal.role);
      window.location.replace(portal.path);
    } catch (error) {
      setOpening(null);
      setError(error.response?.data?.message || 'Unable to open the test portal. Please try again.');
    }
  }

  return (
    <div className="mt-5">
      <div className="flex flex-wrap gap-2" aria-label="Portal testing">
        {portals.map(({ Icon, ...portal }) => (
          <button
            key={portal.role}
            type="button"
            disabled={opening !== null}
            onClick={() => openPortal(portal)}
            className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-primary-500/25 bg-primary-500/10 px-3.5 py-2 text-sm font-semibold text-primary-700 hover:bg-primary-500/20 disabled:opacity-60 dark:text-primary-300"
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            {opening === portal.role ? 'Opening ' + portal.name + '…' : 'Test ' + portal.name + ' Portal'}
          </button>
        ))}
      </div>
      {error && <p role="alert" className="mt-2 text-sm text-red-700 dark:text-red-300">{error}</p>}
    </div>
  );
}

export function PortalTestBanner() {
  const { user, portalTest } = useAuth();
  const portal = portals.find((item) => item.role === portalTest?.role && item.role === user?.role);
  if (!portal) return null;

  function returnToAdmin() {
    setPortalTestRole(null);
    window.location.replace('/admin');
  }

  return (
    <aside aria-label="Portal test mode" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-3.5 text-amber-950 dark:border-amber-400/40 dark:bg-amber-950/40 dark:text-amber-100">
      <div>
        <p className="text-sm font-bold">{portal.name} Portal · Test mode</p>
        <p className="text-xs">
          {portal.role === 'student'
            ? 'Progress is saved to your test profile. Reward redemption is disabled.'
            : 'Student reports show test data. Publishing is disabled.'}
        </p>
      </div>
      <button
        type="button"
        onClick={returnToAdmin}
        className="inline-flex min-h-10 items-center gap-2 rounded-xl bg-amber-200 px-3 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-300"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to System Admin
      </button>
    </aside>
  );
}
