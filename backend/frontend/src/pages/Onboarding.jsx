import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import Card from '../components/Card';
import Button from '../components/Button';
import { AlertCircle, Building2, BookOpen, MapPin, Briefcase } from 'lucide-react';

export default function Onboarding() {
  const { user, setProfile, setStreak } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState(user?.role !== 'student' && user?.role !== 'teacher' ? 'student' : user.role);
  const [stream, setStream] = useState('Science');
  const [department, setDepartment] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [address, setAddress] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      // Assuming authAPI has completeProfile exported
      const data = { role, stream, department, schoolName, address };
      const res = await authAPI.completeProfile(data);
      
      // Navigate to correct dashboard after profile is completed
      if (res.user.role === 'admin') {
        navigate('/admin');
      } else if (res.user.role === 'teacher') {
        navigate('/teacher');
      } else if (res.user.role === 'external_teacher') {
        navigate('/external-teacher');
      } else {
        navigate('/dashboard');
      }
      
      // Optionally reload the page to refresh context, or context could be updated here if we have a function for it
      window.location.reload();
      
    } catch (err) {
      setErrorMsg(err.message || 'Failed to complete profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-grid-pattern py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute top-1/4 left-1/3 -z-10 h-72 w-72 rounded-full bg-primary-500/10 blur-[90px] pulse-glow" />

      <Card className="w-full max-w-lg p-8 border border-slate-100 dark:border-slate-800/40 relative shadow-lg">
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl shadow-md shadow-primary-500/20 mb-3 bg-white dark:bg-slate-800">
            <Building2 className="h-6 w-6 text-primary-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight text-center">Complete Your Profile</h2>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-2 text-center">
            Since you are logging in from a school or organisation, please provide these compulsory details.
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-red-50 dark:bg-red-950/20 p-4 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200/50 mb-6">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Role
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200/70 bg-white/50 dark:border-slate-800 dark:bg-slate-950/50 text-slate-800 dark:text-slate-100 focus:border-primary-500 focus:outline-none text-sm"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              School / Organisation Name *
            </label>
            <div className="relative">
              <Building2 className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
              <input
                type="text"
                required
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                placeholder="XYZ High School"
                className="w-full pl-10.5 pr-4 py-2.5 rounded-xl border border-slate-200/70 bg-white/50 dark:border-slate-800 dark:bg-slate-950/50 text-slate-800 dark:text-slate-100 placeholder-slate-400/60 focus:border-primary-500 focus:outline-none text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Stream *
              </label>
              <div className="relative">
                <BookOpen className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={stream}
                  onChange={(e) => setStream(e.target.value)}
                  placeholder="Science"
                  className="w-full pl-10.5 pr-4 py-2.5 rounded-xl border border-slate-200/70 bg-white/50 dark:border-slate-800 dark:bg-slate-950/50 text-slate-800 dark:text-slate-100 placeholder-slate-400/60 focus:border-primary-500 focus:outline-none text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                Department *
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
                <input
                  type="text"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Computer Science"
                  className="w-full pl-10.5 pr-4 py-2.5 rounded-xl border border-slate-200/70 bg-white/50 dark:border-slate-800 dark:bg-slate-950/50 text-slate-800 dark:text-slate-100 placeholder-slate-400/60 focus:border-primary-500 focus:outline-none text-sm"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">
              Address *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3.5 top-3 w-4.5 h-4.5 text-slate-400" />
              <textarea
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="School/Organisation Address"
                className="w-full pl-10.5 pr-4 py-2.5 rounded-xl border border-slate-200/70 bg-white/50 dark:border-slate-800 dark:bg-slate-950/50 text-slate-800 dark:text-slate-100 placeholder-slate-400/60 focus:border-primary-500 focus:outline-none text-sm min-h-[80px]"
              />
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full py-3 mt-4">
            {loading ? 'Saving details...' : 'Complete Profile & Continue'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
