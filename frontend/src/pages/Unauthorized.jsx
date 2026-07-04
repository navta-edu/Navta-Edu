import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Button from '../components/Button';

export default function Unauthorized() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center p-6 space-y-4">
      <div className="p-4 rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-500 animate-pulse">
        <ShieldAlert className="w-12 h-12" />
      </div>
      <h1 className="text-2xl font-black text-slate-900 dark:text-white">Access Denied</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">
        You do not have the required access permissions to view this dashboard page.
      </p>
      <div className="pt-4">
        <Link to="/">
          <Button icon={ArrowLeft} variant="secondary">Back to Safety</Button>
        </Link>
      </div>
    </div>
  );
}
