import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { Settings, Volume2, Bell, Languages, ShieldAlert, CheckCircle } from 'lucide-react';
import { authAPI } from '../utils/api';

export default function SettingsPage() {
  const { user, setUser } = useAuth();
  const [sounds, setSounds] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('English');
  const [verifying, setVerifying] = useState(false);

  const handleVerifyEmail = async () => {
    setVerifying(true);
    try {
      await authAPI.verifyEmail();
      alert('Verification email sent (simulated). Account is now verified!');
      if (user) {
        setUser({
          ...user,
          isVerified: true
        });
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Details */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-primary-500" />
          Account Settings
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Adjust portal configurations, sound toggles, and verify access roles.
        </p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Verification Alert Card */}
        {user && !user.isVerified && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border border-amber-200/50 dark:border-amber-900/30">
            <div className="flex gap-3 items-start">
              <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold">Email Verification Required</h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Please verify your email address to unlock all teacher uploads and administrative roles.</p>
              </div>
            </div>
            <Button
              onClick={handleVerifyEmail}
              disabled={verifying}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs border-none"
            >
              {verifying ? 'Verifying...' : 'Verify Now'}
            </Button>
          </div>
        )}

        {/* Verification Success Card */}
        {user && user.isVerified && (
          <div className="flex gap-3 items-start p-5 rounded-3xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-900/30">
            <CheckCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">Account Fully Verified</h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Your email address has been verified. You have full access to study sheets, past papers, and mock quiz creator forms.</p>
            </div>
          </div>
        )}

        {/* Preferences Toggle Form */}
        <Card title="Portal Preferences" subtitle="Sound effects and display configurations">
          <div className="space-y-6 mt-6">
            {/* Sounds Switch */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Gamification Sound Effects</h4>
                  <p className="text-[10px] text-slate-400">Play alert notes when correct answers are submitted or coins earned</p>
                </div>
              </div>
              <button
                onClick={() => setSounds(!sounds)}
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                  sounds ? 'bg-primary-500' : 'bg-slate-250 dark:bg-slate-800'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                  sounds ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Notifications Switch */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Push Notifications</h4>
                  <p className="text-[10px] text-slate-400">Remind me when study streaks are close to resetting</p>
                </div>
              </div>
              <button
                onClick={() => setNotifications(!notifications)}
                className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${
                  notifications ? 'bg-primary-500' : 'bg-slate-250 dark:bg-slate-800'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all ${
                  notifications ? 'right-1' : 'left-1'
                }`} />
              </button>
            </div>

            {/* Language Selection */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                  <Languages className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">Portal Language</h4>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide mt-0.5 text-primary-500">{language}</p>
                </div>
              </div>
              
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-xs focus:outline-none"
              >
                <option value="English">English</option>
                <option value="Spanish">Spanish</option>
                <option value="Hindi">Hindi</option>
              </select>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
