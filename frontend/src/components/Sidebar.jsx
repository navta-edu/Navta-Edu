import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  ClipboardCheck,
  BarChart3,
  Trophy,
  User,
  Settings,
  Users,
  PlusSquare,
  Award
} from 'lucide-react';

export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return null;

  // Student Links
  const studentLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/notes', label: 'Study Notes', icon: BookOpen },
    { to: '/pyqs', label: 'PYQ Papers', icon: FileText },
    { to: '/assessments', label: 'Assessments', icon: ClipboardCheck },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/rewards', label: 'Reward Shop', icon: Trophy },
    { to: '/profile', label: 'My Profile', icon: User },
    { to: '/settings', label: 'Settings', icon: Settings }
  ];

  // Teacher Links
  const teacherLinks = [
    { to: '/teacher', label: 'Overview', icon: LayoutDashboard },
    { to: '/notes', label: 'Manage Notes', icon: BookOpen },
    { to: '/pyqs', label: 'Manage PYQs', icon: FileText },
    { to: '/assessments', label: 'Manage Quizzes', icon: ClipboardCheck },
    { to: '/settings', label: 'Settings', icon: Settings }
  ];

  const adminLinks = [
    { to: '/admin', label: 'Platform Stats', icon: LayoutDashboard },
    { to: '/admin', label: 'User Audits', icon: Users, hash: '#users' },
    { to: '/admin', label: 'Study Material', icon: BookOpen, hash: '#studyMaterial' },
    { to: '/admin', label: 'Reward Store', icon: Award, hash: '#reward' },
    { to: '/settings', label: 'Settings', icon: Settings }
  ];

  const getLinks = () => {
    if (user.role === 'admin') return adminLinks;
    if (user.role === 'teacher') return teacherLinks;
    return studentLinks;
  };

  const links = getLinks();

  return (
    <aside className="w-full md:w-64 border-b md:border-b-0 md:border-r border-slate-200/80 bg-white/70 dark:border-slate-800/80 dark:bg-darkbg/50 backdrop-blur-md p-4 transition-colors duration-200 flex md:flex-col gap-1 md:h-[calc(100vh-4rem)] md:sticky md:top-16 overflow-y-auto no-scrollbar">
      <div className="flex md:flex-col gap-1.5 w-full overflow-x-auto md:overflow-x-visible pb-2 md:pb-0">
        {links.map((link, index) => {
          const Icon = link.icon;
          const targetUrl = link.to + (link.hash || '');
          
          let isActive = false;
          if (link.hash) {
            isActive = location.pathname === link.to && location.hash === link.hash;
          } else {
            // For dashboard/admin base routes, active only if no hash
            if (link.to === '/admin' || link.to === '/dashboard' || link.to === '/teacher') {
              isActive = location.pathname === link.to && !location.hash;
            } else {
              isActive = location.pathname.startsWith(link.to);
            }
          }
          
          return (
            <NavLink
              key={index}
              to={targetUrl}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
                isActive
                  ? 'bg-primary-500 text-white shadow-md shadow-primary-500/10'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </div>
    </aside>
  );
}
