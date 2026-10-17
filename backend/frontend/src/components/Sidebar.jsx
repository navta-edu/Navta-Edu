import React, { useState } from 'react';
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
  Award,
  FilePlus2,
  Target,
  Crop,
  PanelLeftClose,
  PanelLeftOpen,
  Sparkles,
} from 'lucide-react';

/**
 * NAVTA role-aware sidebar.
 * Navigation targets and role groupings are kept aligned with the existing app.
 * Collapsing affects presentation only; it does not change route permissions.
 */
export default function Sidebar() {
  const { user } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const studentLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/notes', label: 'Study Notes', icon: BookOpen },
    { to: '/pyqs', label: 'PYQ Papers', icon: FileText },
    { to: '/navta-test', label: 'Navta TEST', icon: ClipboardCheck },
    { to: '/assessments', label: 'Assessments', icon: ClipboardCheck },
    { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    { to: '/rewards', label: 'Reward Shop', icon: Trophy },
    { to: '/profile', label: 'My Profile', icon: User },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const teacherLinks = [
    { to: '/teacher', label: 'Overview', icon: LayoutDashboard },
    { to: '/notes', label: 'Manage Notes', icon: BookOpen },
    { to: '/pyqs', label: 'Manage PYQs', icon: FileText },
    { to: '/assessments', label: 'Manage Quizzes', icon: ClipboardCheck },
    { to: '/teacher/question-paper-builder', label: 'Paper Builder', icon: FilePlus2 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const externalTeacherLinks = [
    { to: '/external-teacher', label: 'Overview', icon: LayoutDashboard },
    { to: '/notes', label: 'Study Notes', icon: BookOpen },
    { to: '/pyqs', label: 'PYQ Papers', icon: FileText },
    { to: '/assessments', label: 'Assessments', icon: ClipboardCheck },
    { to: '/educator/question-paper-builder', label: 'Paper Builder', icon: FilePlus2 },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const adminLinks = [
    { to: '/admin', label: 'Platform Stats', icon: LayoutDashboard },
    { to: '/admin', label: 'User Audits', icon: Users, hash: '#users' },
    { to: '/admin', label: 'Study Material', icon: BookOpen, hash: '#studyMaterial' },
    { to: '/admin', label: 'Study Notes', icon: BookOpen, hash: '#note' },
    { to: '/admin/navta-test', label: 'Navta TEST', icon: Target },
    { to: '/admin/pdf-question-cropper', label: 'PDF Question Cropper', icon: Crop },
    { to: '/admin', label: 'Reward Store', icon: Award, hash: '#reward' },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  const links = user.role === 'admin'
    ? adminLinks
    : user.role === 'teacher'
      ? teacherLinks
      : user.role === 'external_teacher'
        ? externalTeacherLinks
        : studentLinks;

  const isLinkActive = (link) => {
    if (link.hash) return location.pathname === link.to && location.hash === link.hash;
    if (['/admin', '/dashboard', '/teacher', '/external-teacher'].includes(link.to)) {
      return location.pathname === link.to && !location.hash;
    }
    return location.pathname === link.to || location.pathname.startsWith(`${link.to}/`);
  };

  return (
    <aside
      className={`navta-neon-sidebar navta-scroll-area w-full shrink-0 md:sticky md:top-16 md:h-[calc(100vh-4rem)] md:self-start ${collapsed ? 'md:w-[5.25rem]' : 'md:w-64'}`}
      aria-label="Main navigation"
      data-collapsed={collapsed ? 'true' : 'false'}
    >
      <div className="navta-sidebar-brand">
        <div className="navta-sidebar-brand-mark" aria-hidden="true">
          <Sparkles size={19} strokeWidth={2.3} />
        </div>
        {!collapsed && (
          <div className="navta-sidebar-brand-copy">
            <span className="navta-sidebar-brand-name">NAVTA</span>
            <span className="navta-sidebar-brand-caption">LEARNING SPACE</span>
          </div>
        )}
        <button
          type="button"
          className="navta-sidebar-collapse"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>

      <div className="navta-sidebar-section-label">
        {!collapsed && <><span>WORKSPACE</span><span className="navta-sidebar-section-line" /></>}
      </div>

      <nav className="navta-sidebar-nav">
        {links.map((link, index) => {
          const Icon = link.icon;
          const targetUrl = `${link.to}${link.hash || ''}`;
          const active = isLinkActive(link);
          return (
            <NavLink
              key={`${link.to}-${link.hash || index}`}
              to={targetUrl}
              title={collapsed ? link.label : undefined}
              aria-label={link.label}
              aria-current={active ? 'page' : undefined}
              className={`navta-sidebar-link ${active ? 'is-active' : ''} ${collapsed ? 'is-collapsed' : ''}`}
            >
              <span className="navta-sidebar-icon-wrap"><Icon size={19} strokeWidth={active ? 2.25 : 1.9} /></span>
              {!collapsed && <span className="navta-sidebar-link-label">{link.label}</span>}
              {!collapsed && active && <span className="navta-sidebar-active-dot" aria-hidden="true" />}
            </NavLink>
          );
        })}
      </nav>

      {!collapsed && (
        <div className="navta-sidebar-bottom-card">
          <div className="navta-sidebar-bottom-icon"><Sparkles size={17} /></div>
          <div className="navta-sidebar-bottom-copy">
            <strong>Keep learning</strong>
            <span>Small steps, big progress.</span>
          </div>
          <span className="navta-sidebar-status-dot" aria-label="NAVTA active" />
        </div>
      )}
      {collapsed && <div className="navta-sidebar-collapsed-glow" aria-hidden="true" />}

      <style>{`
        .navta-neon-sidebar {
          position: relative;
          z-index: 20;
          display: flex;
          flex-direction: column;
          gap: 0;
          min-width: 0;
          padding: 16px 11px 14px;
          overflow-x: hidden;
          overflow-y: auto;
          border-right: 1px solid rgba(125, 148, 205, .15);
          background: linear-gradient(180deg, rgba(7, 13, 31, .98) 0%, rgba(8, 13, 30, .97) 58%, rgba(13, 12, 37, .98) 100%);
          box-shadow: 12px 0 40px rgba(1, 5, 20, .13), inset -1px 0 0 rgba(125, 95, 255, .035);
          transition: width .24s ease, padding .24s ease, background .2s ease;
        }
        .navta-neon-sidebar:before {
          content: '';
          position: absolute;
          width: 190px;
          height: 190px;
          left: -115px;
          top: 90px;
          border-radius: 50%;
          pointer-events: none;
          background: rgba(30, 116, 255, .13);
          filter: blur(58px);
        }
        .navta-sidebar-brand { position: relative; display: flex; align-items: center; gap: 10px; min-height: 48px; padding: 0 5px 14px; border-bottom: 1px solid rgba(140, 155, 205, .12); }
        .navta-sidebar-brand-mark { display: grid; place-items: center; width: 38px; height: 38px; flex: 0 0 38px; color: white; border-radius: 13px; background: linear-gradient(135deg, #05b8f4 0%, #4567ff 48%, #963cff 100%); box-shadow: 0 5px 20px rgba(74, 88, 255, .28), inset 0 1px 0 rgba(255,255,255,.3); }
        .navta-sidebar-brand-copy { display: flex; flex-direction: column; min-width: 0; line-height: 1.1; }
        .navta-sidebar-brand-name { color: #f7f8ff; font-size: 15px; font-weight: 850; letter-spacing: .13em; }
        .navta-sidebar-brand-caption { margin-top: 5px; color: #7e8bad; font-size: 8px; font-weight: 750; letter-spacing: .16em; white-space: nowrap; }
        .navta-sidebar-collapse { display: grid; place-items: center; width: 31px; height: 31px; flex: 0 0 31px; margin-left: auto; border: 1px solid rgba(137, 154, 207, .17); border-radius: 10px; color: #a9b6d7; background: rgba(22, 31, 61, .78); cursor: pointer; transition: color .18s, border-color .18s, background .18s; }
        .navta-sidebar-collapse:hover { color: white; border-color: rgba(86, 116, 255, .65); background: rgba(60, 68, 155, .45); }
        .navta-sidebar-section-label { display: flex; align-items: center; gap: 10px; height: 42px; padding: 0 8px; color: #657394; font-size: 9px; font-weight: 800; letter-spacing: .17em; }
        .navta-sidebar-section-line { height: 1px; flex: 1; background: linear-gradient(90deg, rgba(105, 119, 166, .25), transparent); }
        .navta-sidebar-nav { position: relative; display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }
        .navta-sidebar-link { position: relative; display: flex; align-items: center; gap: 12px; min-height: 45px; padding: 0 11px; overflow: hidden; border: 1px solid transparent; border-radius: 13px; color: #91a0c0; text-decoration: none; font-size: 12px; font-weight: 650; white-space: nowrap; transition: color .18s ease, background .18s ease, border-color .18s ease, transform .18s ease, box-shadow .18s ease; }
        .navta-sidebar-link:before { content: ''; position: absolute; inset: 0; opacity: 0; background: linear-gradient(105deg, rgba(0, 190, 255, .14), rgba(91, 81, 255, .17) 60%, rgba(166, 60, 255, .12)); transition: opacity .18s ease; }
        .navta-sidebar-link:hover { color: #f2f5ff; border-color: rgba(110, 128, 211, .13); transform: translateX(2px); }
        .navta-sidebar-link:hover:before { opacity: 1; }
        .navta-sidebar-icon-wrap { position: relative; z-index: 1; display: grid; place-items: center; width: 25px; height: 25px; flex: 0 0 25px; color: #8494bb; transition: color .18s ease, filter .18s ease; }
        .navta-sidebar-link-label { position: relative; z-index: 1; overflow: hidden; text-overflow: ellipsis; }
        .navta-sidebar-link.is-active { color: #fff; border-color: rgba(91, 139, 255, .38); background: linear-gradient(105deg, #08b9ed 0%, #426dff 48%, #8b3df0 100%); box-shadow: 0 7px 22px rgba(50, 92, 255, .22), inset 0 1px 0 rgba(255,255,255,.22); }
        .navta-sidebar-link.is-active:before { opacity: 0; }
        .navta-sidebar-link.is-active .navta-sidebar-icon-wrap { color: #fff; filter: drop-shadow(0 0 7px rgba(255,255,255,.26)); }
        .navta-sidebar-active-dot { position: relative; z-index: 1; width: 5px; height: 5px; margin-left: auto; flex: 0 0 5px; border-radius: 50%; background: #fff; box-shadow: 0 0 9px rgba(255,255,255,.85); }
        .navta-sidebar-link.is-collapsed { justify-content: center; gap: 0; padding: 0; }
        .navta-sidebar-link.is-collapsed .navta-sidebar-icon-wrap { width: 27px; flex-basis: 27px; }
        .navta-sidebar-bottom-card { position: relative; display: flex; align-items: center; gap: 9px; margin: 20px 1px 0; padding: 11px 9px; border: 1px solid rgba(109, 106, 255, .2); border-radius: 14px; background: linear-gradient(130deg, rgba(16, 35, 70, .86), rgba(35, 19, 68, .72)); }
        .navta-sidebar-bottom-icon { display: grid; place-items: center; width: 30px; height: 30px; flex: 0 0 30px; color: #b2a2ff; border-radius: 10px; background: linear-gradient(135deg, rgba(0, 185, 255, .16), rgba(148, 63, 255, .25)); }
        .navta-sidebar-bottom-copy { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .navta-sidebar-bottom-copy strong { color: #e9edff; font-size: 10px; font-weight: 750; }
        .navta-sidebar-bottom-copy span { color: #8492b5; font-size: 9px; white-space: nowrap; }
        .navta-sidebar-status-dot { width: 6px; height: 6px; margin-left: auto; flex: 0 0 6px; border-radius: 50%; background: #35e6b1; box-shadow: 0 0 8px rgba(53,230,177,.7); }
        .navta-sidebar-collapsed-glow { height: 3px; margin: 20px 7px 0; border-radius: 9px; background: linear-gradient(90deg, #03c5f5, #5264ff, #a43cff); box-shadow: 0 0 13px rgba(87, 87, 255, .55); }
        @media (max-width: 767px) {
          .navta-neon-sidebar { position: relative; top: auto; height: auto; max-height: none; padding: 10px; border-right: 0; border-bottom: 1px solid rgba(125, 148, 205, .15); }
          .navta-sidebar-brand { padding-bottom: 9px; }
          .navta-sidebar-section-label { height: 29px; }
          .navta-sidebar-nav { flex-direction: row; gap: 6px; overflow-x: auto; padding-bottom: 2px; }
          .navta-sidebar-link { min-width: 44px; min-height: 42px; }
          .navta-sidebar-link.is-collapsed { padding: 0 10px; }
          .navta-sidebar-bottom-card, .navta-sidebar-collapsed-glow { display: none; }
        }
        /* Light-mode theme: keep the neon accent, but use readable light surfaces. */
        html.light .navta-neon-sidebar, body.light .navta-neon-sidebar,
        html[data-theme="light"] .navta-neon-sidebar, body[data-theme="light"] .navta-neon-sidebar,
        [data-theme="light"] .navta-neon-sidebar {
          border-right-color: rgba(93, 113, 158, .20);
          background: linear-gradient(180deg, #ffffff 0%, #f7f8ff 58%, #f4f3ff 100%);
          box-shadow: 10px 0 32px rgba(35, 48, 85, .07), inset -1px 0 0 rgba(108, 91, 255, .05);
        }
        html.light .navta-neon-sidebar:before, body.light .navta-neon-sidebar:before,
        html[data-theme="light"] .navta-neon-sidebar:before, body[data-theme="light"] .navta-neon-sidebar:before,
        [data-theme="light"] .navta-neon-sidebar:before { background: rgba(70, 130, 255, .09); }
        html.light .navta-sidebar-brand, body.light .navta-sidebar-brand,
        html[data-theme="light"] .navta-sidebar-brand, body[data-theme="light"] .navta-sidebar-brand,
        [data-theme="light"] .navta-sidebar-brand { border-bottom-color: rgba(93, 113, 158, .17); }
        html.light .navta-sidebar-brand-name, body.light .navta-sidebar-brand-name,
        html[data-theme="light"] .navta-sidebar-brand-name, body[data-theme="light"] .navta-sidebar-brand-name,
        [data-theme="light"] .navta-sidebar-brand-name { color: #111a32; }
        html.light .navta-sidebar-brand-caption, body.light .navta-sidebar-brand-caption,
        html[data-theme="light"] .navta-sidebar-brand-caption, body[data-theme="light"] .navta-sidebar-brand-caption,
        [data-theme="light"] .navta-sidebar-brand-caption { color: #7783a1; }
        html.light .navta-sidebar-collapse, body.light .navta-sidebar-collapse,
        html[data-theme="light"] .navta-sidebar-collapse, body[data-theme="light"] .navta-sidebar-collapse,
        [data-theme="light"] .navta-sidebar-collapse { color: #53617f; border-color: rgba(93,113,158,.22); background: #f0f3fb; }
        html.light .navta-sidebar-section-label, body.light .navta-sidebar-section-label,
        html[data-theme="light"] .navta-sidebar-section-label, body[data-theme="light"] .navta-sidebar-section-label,
        [data-theme="light"] .navta-sidebar-section-label { color: #7d89a5; }
        html.light .navta-sidebar-link, body.light .navta-sidebar-link,
        html[data-theme="light"] .navta-sidebar-link, body[data-theme="light"] .navta-sidebar-link,
        [data-theme="light"] .navta-sidebar-link { color: #5d6b89; }
        html.light .navta-sidebar-icon-wrap, body.light .navta-sidebar-icon-wrap,
        html[data-theme="light"] .navta-sidebar-icon-wrap, body[data-theme="light"] .navta-sidebar-icon-wrap,
        [data-theme="light"] .navta-sidebar-icon-wrap { color: #7382a5; }
        html.light .navta-sidebar-link:hover, body.light .navta-sidebar-link:hover,
        html[data-theme="light"] .navta-sidebar-link:hover, body[data-theme="light"] .navta-sidebar-link:hover,
        [data-theme="light"] .navta-sidebar-link:hover { color: #273456; border-color: rgba(110,128,211,.20); }
        html.light .navta-sidebar-link.is-active, body.light .navta-sidebar-link.is-active,
        html[data-theme="light"] .navta-sidebar-link.is-active, body[data-theme="light"] .navta-sidebar-link.is-active,
        [data-theme="light"] .navta-sidebar-link.is-active { color: #fff; background: linear-gradient(105deg,#08aee8 0%,#4b68f5 48%,#913df0 100%); box-shadow: 0 7px 20px rgba(75,91,230,.22), inset 0 1px 0 rgba(255,255,255,.28); }
        html.light .navta-sidebar-bottom-card, body.light .navta-sidebar-bottom-card,
        html[data-theme="light"] .navta-sidebar-bottom-card, body[data-theme="light"] .navta-sidebar-bottom-card,
        [data-theme="light"] .navta-sidebar-bottom-card { border-color: rgba(109,106,255,.18); background: linear-gradient(130deg,#f0f6ff,#f6f0ff); }
        html.light .navta-sidebar-bottom-copy strong, body.light .navta-sidebar-bottom-copy strong,
        html[data-theme="light"] .navta-sidebar-bottom-copy strong, body[data-theme="light"] .navta-sidebar-bottom-copy strong,
        [data-theme="light"] .navta-sidebar-bottom-copy strong { color: #202b49; }
        html.light .navta-sidebar-bottom-copy span, body.light .navta-sidebar-bottom-copy span,
        html[data-theme="light"] .navta-sidebar-bottom-copy span, body[data-theme="light"] .navta-sidebar-bottom-copy span,
        [data-theme="light"] .navta-sidebar-bottom-copy span { color: #7885a2; }
        @media (prefers-reduced-motion: reduce) { .navta-neon-sidebar, .navta-sidebar-link, .navta-sidebar-link:before { transition: none; } }
      `}</style>
    </aside>
  );
}
