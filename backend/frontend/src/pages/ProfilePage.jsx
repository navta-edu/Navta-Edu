import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Button from '../components/Button';
import { User, Mail, Flame, Award, Shield, Check } from 'lucide-react';
import { authAPI } from '../utils/api';

export default function ProfilePage() {
  const { user, profile, streak, setProfile } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [stream, setStream] = useState(profile?.stream || 'Science');
  const [isUpdating, setIsUpdating] = useState(false);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      // Simulate profile updates or make actual API calls
      alert('Profile updated successfully!');
      if (profile) {
        setProfile({
          ...profile,
          stream
        });
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title Details */}
      <div className="border-b border-slate-200 dark:border-slate-800 pb-4">
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <User className="w-6 h-6 text-primary-500" />
          My Profile
        </h1>
        <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
          Review your credentials, study streams, and accumulated achievements.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column: User Card */}
        <div className="space-y-6">
          <Card className="text-center p-6">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-500 text-white font-extrabold text-3xl shadow-md">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mt-4">{user?.name}</h2>
            <p className="text-xs text-slate-400 capitalize">{user?.role}</p>

            <div className="mt-6 space-y-3 border-t border-slate-100 dark:border-slate-800/40 pt-4 text-xs text-left text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-slate-350" />
                <span>{user?.email}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Shield className="w-4 h-4 text-slate-350" />
                <span className="capitalize">{user?.role} Access Level</span>
              </div>
              {user?.isVerified && (
                <div className="flex items-center gap-2.5 text-emerald-500 font-semibold">
                  <Check className="w-4 h-4" />
                  <span>Email Verified</span>
                </div>
              )}
            </div>
          </Card>

          {/* Gamified streaks overview */}
          {user?.role === 'student' && (
            <Card className="p-6">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Streak Highlights</h3>
                <Flame className="w-5 h-5 text-amber-500 fill-amber-500" />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4 text-center">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                  <p className="text-xl font-black text-slate-900 dark:text-white">{streak?.currentStreak || 1}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Current Streak</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-800/20 rounded-2xl border border-slate-100 dark:border-slate-800/40">
                  <p className="text-xl font-black text-slate-900 dark:text-white">{streak?.longestStreak || 1}</p>
                  <p className="text-[9px] text-slate-400 uppercase tracking-wider font-bold">Longest Streak</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right column: Edit Profile & Badges list */}
        <div className="lg:col-span-2 space-y-6">
          <Card title="Update Profile Details" subtitle="Make adjustments to your login details and curriculum streams">
            <form onSubmit={handleUpdateProfile} className="space-y-4 mt-4 max-w-xl">
              <div>
                <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Display Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your Name"
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                />
              </div>

              {user?.role === 'student' && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-2">Academic Stream</label>
                  <select
                    value={stream}
                    onChange={(e) => setStream(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 dark:bg-slate-950 text-slate-800 dark:text-slate-100 text-sm focus:outline-none"
                  >
                    <option value="Science">Science (PCM/PCB)</option>
                    <option value="Commerce">Commerce</option>
                    <option value="Arts">Arts</option>
                    <option value="General">General Study</option>
                  </select>
                </div>
              )}

              <Button type="submit" disabled={isUpdating}>
                {isUpdating ? 'Saving...' : 'Save Changes'}
              </Button>
            </form>
          </Card>

          {/* Badges card list */}
          {user?.role === 'student' && (
            <Card title="Acquired Badges & Milestones" subtitle="Earn badges by finishing study tasks and logging streak goals">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {profile?.badges?.map((badge, index) => (
                  <div key={index} className="flex flex-col items-center text-center p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/10 border border-slate-100 dark:border-slate-800/40">
                    <div className="p-3.5 rounded-full bg-amber-50 dark:bg-amber-950/20 text-amber-500 mb-2">
                      <Award className="w-6 h-6 fill-amber-400" />
                    </div>
                    <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200 leading-snug">{badge.name}</p>
                    <p className="text-[9px] text-slate-400 mt-1">{new Date(badge.earnedAt).toLocaleDateString()}</p>
                  </div>
                ))}
                {(!profile?.badges || profile.badges.length === 0) && (
                  <div className="col-span-full py-8 text-center text-slate-400">
                    Attempt quizzes or maintain streaks to claim your first badge!
                  </div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
