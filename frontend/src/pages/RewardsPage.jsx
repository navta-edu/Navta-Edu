import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { studentAPI } from '../utils/api';
import Card from '../components/Card';
import Button from '../components/Button';
import { Trophy, Coins, Award, HelpCircle, Gift, Flame, ArrowRight, UserCheck } from 'lucide-react';

export default function RewardsPage() {
  const { profile, updateProfileStats } = useAuth();
  const [rewards, setRewards] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemingId, setRedeemingId] = useState(null);

  const loadData = async () => {
    try {
      const rewList = await studentAPI.getRewards();
      setRewards(rewList.data || []);

      const lBoard = await studentAPI.getLeaderboard();
      setLeaderboard(lBoard.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRedeem = async (rewardId, costCoins, title) => {
    if (profile && profile.coins < costCoins) {
      alert(`Insufficient coins. This reward costs ${costCoins} coins, but you only have ${profile.coins} coins.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to spend ${costCoins} coins to redeem '${title}'?`)) return;

    setRedeemingId(rewardId);
    try {
      const res = await studentAPI.redeemReward(rewardId);
      alert(res.message || 'Successfully redeemed!');
      
      // Update local context stats
      if (res.coinsRemaining !== undefined) {
        updateProfileStats(res.coinsRemaining, profile.xp, profile.level, res.badges);
      }
      loadData();
    } catch (err) {
      alert(err.message);
    } finally {
      setRedeemingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary-500 animate-pulse" />
            Navta Reward Center
          </h1>
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
            Redeem accumulated study coins for real badges, discount coupons, or consultation hours.
          </p>
        </div>

        {/* Coins indicator */}
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400 border border-yellow-200/50 dark:border-yellow-900/30 w-fit">
          <Coins className="w-5 h-5 text-yellow-500" />
          <span className="text-sm font-extrabold">{profile?.coins ?? 0} Coins available</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column: Reward Cards catalog */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">Rewards Store</h3>
          <div className="grid md:grid-cols-2 gap-6">
            {rewards.map((rew) => {
              const hasEnough = profile && profile.coins >= rew.costCoins;
              return (
                <Card key={rew._id} className="flex flex-col justify-between h-full">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="p-3 rounded-2xl bg-yellow-50 dark:bg-yellow-950/20 text-yellow-500">
                        <Gift className="w-6 h-6" />
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-450 text-[9px] font-black uppercase">
                        {rew.type}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{rew.title}</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed">{rew.description}</p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/40 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-1 text-xs text-yellow-600 dark:text-yellow-400 font-extrabold">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      <span>{rew.costCoins} Coins</span>
                    </div>
                    
                    <Button
                      onClick={() => handleRedeem(rew._id, rew.costCoins, rew.title)}
                      disabled={redeemingId === rew._id}
                      variant={hasEnough ? 'primary' : 'outline'}
                      className="px-3.5 py-2 text-xs"
                    >
                      {redeemingId === rew._id ? 'Claiming...' : 'Redeem Item'}
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Right Column: Global Leaderboard */}
        <div className="space-y-6">
          <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider pl-1">Global Rankings</h3>
          <Card title="Leaderboard" subtitle="Top performing students on Navta">
            <div className="mt-4 space-y-4">
              {leaderboard.map((student) => (
                <div
                  key={student.rank}
                  className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                    student.name === profile?.name
                      ? 'bg-primary-50/50 dark:bg-primary-950/15 border-primary-500/50'
                      : 'bg-slate-50/20 dark:bg-slate-800/10 border-slate-100 dark:border-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-xl font-black text-xs ${
                      student.rank === 1
                        ? 'bg-yellow-500 text-white'
                        : student.rank === 2
                        ? 'bg-slate-350 text-white'
                        : student.rank === 3
                        ? 'bg-amber-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}>
                      {student.rank}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate max-w-[100px]">{student.name}</h4>
                      <p className="text-[9px] text-slate-400 mt-0.5">Level {student.level} • {student.badgesCount} Badges</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-primary-500">{student.xp} XP</p>
                  </div>
                </div>
              ))}

              {leaderboard.length === 0 && (
                <p className="text-xs text-center text-slate-400 py-6">No ranks tabulated yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
