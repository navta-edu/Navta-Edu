import React from 'react';

import {
  NavLink,
  useLocation
} from 'react-router-dom';

import {
  useAuth
} from '../context/AuthContext';

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
  FilePlus2
} from 'lucide-react';

export default function Sidebar() {
  const {
    user
  } = useAuth();

  const location =
    useLocation();

  if (!user) {
    return null;
  }

  // =====================================================
  // STUDENT LINKS
  // =====================================================

  const studentLinks = [
    {
      to: '/dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard
    },
    {
      to: '/notes',
      label: 'Study Notes',
      icon: BookOpen
    },
    {
      to: '/pyqs',
      label: 'PYQ Papers',
      icon: FileText
    },
    {
      to: '/navta-test',
      label: 'Navta TEST',
      icon: ClipboardCheck
    },
    {
      to: '/assessments',
      label: 'Assessments',
      icon: ClipboardCheck
    },
    {
      to: '/analytics',
      label: 'Analytics',
      icon: BarChart3
    },
    {
      to: '/rewards',
      label: 'Reward Shop',
      icon: Trophy
    },
    {
      to: '/profile',
      label: 'My Profile',
      icon: User
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Settings
    }
  ];

  // =====================================================
  // TEACHER LINKS
  // =====================================================

  const teacherLinks = [
    {
      to: '/teacher',
      label: 'Overview',
      icon: LayoutDashboard
    },
    {
      to: '/notes',
      label: 'Manage Notes',
      icon: BookOpen
    },
    {
      to: '/pyqs',
      label: 'Manage PYQs',
      icon: FileText
    },
    {
      to: '/assessments',
      label: 'Manage Quizzes',
      icon: ClipboardCheck
    },
    {
      to: '/teacher/question-paper-builder',
      label: 'Paper Builder',
      icon: FilePlus2
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Settings
    }
  ];

  // =====================================================
  // EXTERNAL TEACHER / EDUCATOR LINKS
  // =====================================================

  const externalTeacherLinks = [
    {
      to: '/external-teacher',
      label: 'Overview',
      icon: LayoutDashboard
    },
    {
      to: '/notes',
      label: 'Study Notes',
      icon: BookOpen
    },
    {
      to: '/pyqs',
      label: 'PYQ Papers',
      icon: FileText
    },
    {
      to: '/assessments',
      label: 'Assessments',
      icon: ClipboardCheck
    },
    {
      to: '/educator/question-paper-builder',
      label: 'Paper Builder',
      icon: FilePlus2
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Settings
    }
  ];

  // =====================================================
  // ADMIN LINKS
  // =====================================================

  const adminLinks = [
    {
      to: '/admin',
      label: 'Platform Stats',
      icon: LayoutDashboard
    },
    {
      to: '/admin',
      label: 'User Audits',
      icon: Users,
      hash: '#users'
    },
    {
      to: '/admin',
      label: 'Study Material',
      icon: BookOpen,
      hash: '#studyMaterial'
    },
    {
      to: '/admin',
      label: 'Reward Store',
      icon: Award,
      hash: '#reward'
    },
    {
      to: '/settings',
      label: 'Settings',
      icon: Settings
    }
  ];

  // =====================================================
  // ROLE BASED LINKS
  // =====================================================

  const getLinks = () => {
    if (user.role === 'admin') {
      return adminLinks;
    }

    if (user.role === 'teacher') {
      return teacherLinks;
    }

    if (user.role === 'external_teacher') {
      return externalTeacherLinks;
    }

    return studentLinks;
  };

  const links =
    getLinks();

  // =====================================================
  // SIDEBAR
  // =====================================================

  return (
    <aside
      className="
        navta-scroll-area
        w-full
        md:w-64
        md:shrink-0

        border-b
        md:border-b-0
        md:border-r

        border-slate-200/80
        dark:border-slate-800/80

        bg-white/95
        dark:bg-[#071224]/95

        p-4

        transition-colors
        duration-200

        flex
        md:flex-col

        gap-1

        md:h-[calc(100vh-4rem)]
        md:sticky
        md:top-16

        overflow-y-auto
        overflow-x-hidden
        no-scrollbar
      "
    >
      <div
        className="
          flex
          md:flex-col

          gap-1.5

          w-full

          overflow-x-auto
          md:overflow-x-visible
          md:overflow-y-visible

          pb-2
          md:pb-0

          no-scrollbar
        "
      >
        {links.map(
          (
            link,
            index
          ) => {
            const Icon =
              link.icon;

            const targetUrl =
              link.to +
              (
                link.hash ||
                ''
              );

            let isActive =
              false;

            if (link.hash) {
              isActive =
                location.pathname ===
                  link.to &&
                location.hash ===
                  link.hash;
            } else if (
              link.to ===
                '/admin' ||
              link.to ===
                '/dashboard' ||
              link.to ===
                '/teacher' ||
              link.to ===
                '/external-teacher'
            ) {
              isActive =
                location.pathname ===
                  link.to &&
                !location.hash;
            } else {
              isActive =
                location.pathname.startsWith(
                  link.to
                );
            }

            return (
              <NavLink
                key={
                  `${link.to}-${link.hash || index}`
                }
                to={
                  targetUrl
                }
                className={`
                  flex
                  items-center
                  gap-3

                  px-4
                  py-3

                  rounded-xl

                  text-sm
                  font-semibold

                  whitespace-nowrap

                  transition-colors
                  duration-150

                  cursor-pointer
                  select-none

                  ${
                    isActive
                      ? `
                        bg-primary-500
                        text-white
                        shadow-sm
                      `
                      : `
                        text-slate-600
                        dark:text-slate-400

                        hover:bg-slate-100
                        dark:hover:bg-slate-800/80

                        hover:text-slate-900
                        dark:hover:text-white
                      `
                  }
                `}
              >
                <Icon
                  className="
                    w-4.5
                    h-4.5
                    shrink-0
                  "
                />

                <span>
                  {
                    link.label
                  }
                </span>
              </NavLink>
            );
          }
        )}
      </div>
    </aside>
  );
}
