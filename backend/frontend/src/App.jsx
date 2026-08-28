import React, { lazy, Suspense } from 'react';

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Outlet
} from 'react-router-dom';

import {
  AuthProvider,
  useAuth
} from './context/AuthContext';

// =====================================================
// LAYOUT & NAVIGATION
// =====================================================

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';

// =====================================================
// PUBLIC PAGES
// =====================================================

const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Login = lazy(() => import('./pages/Login'));
const Signup = lazy(() => import('./pages/Signup'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const Onboarding = lazy(() => import('./pages/Onboarding'));

// =====================================================
// STUDENT PAGES
// =====================================================

const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const RewardsPage = lazy(() => import('./pages/RewardsPage'));
const ResultDetail = lazy(() => import('./pages/ResultDetail'));
const MistakeNotebookPage = lazy(() => import('./pages/MistakeNotebookPage'));
const StreakPage = lazy(() => import('./pages/StreakPage'));

// =====================================================
// TEACHER / EDUCATOR PAGES
// =====================================================

const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const ExternalTeacherDashboard = lazy(() => import('./pages/ExternalTeacherDashboard'));

// NEW QUESTION PAPER BUILDER
const QuestionPaperBuilder = lazy(() => import('./pages/QuestionPaperBuilder'));

// =====================================================
// ADMIN PAGES
// =====================================================

const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const AdminNavtaTest = lazy(() => import('./pages/AdminNavtaTest'));

// =====================================================
// SHARED PAGES
// =====================================================

const NavtaTestPage = lazy(() => import('./pages/NavtaTestPage'));
const NotesPage = lazy(() => import('./pages/NotesPage'));
const PYQPage = lazy(() => import('./pages/PYQPage'));
const AssessmentPage = lazy(() => import('./pages/AssessmentPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// =====================================================
// PUBLIC LAYOUT
// =====================================================

function PublicLayout() {
  return (
    <div
      className="
        min-h-screen
        flex
        flex-col
        bg-transparent
      "
    >
      <Navbar />

      <main
        className="
          flex-1
          bg-transparent
        "
      >
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

// =====================================================
// DASHBOARD LAYOUT
// =====================================================

function DashboardLayout() {
  const {
    user,
    loading
  } = useAuth();

  // ===================================================
  // LOADING
  // ===================================================

  if (loading) {
    return (
      <div
        className="
          h-screen
          w-screen
          flex
          items-center
          justify-center
          bg-transparent
        "
      >
        <div
          className="
            h-8
            w-8
            animate-spin
            rounded-full
            border-4
            border-primary-500
            border-t-transparent
          "
        />
      </div>
    );
  }

  // ===================================================
  // NOT LOGGED IN
  // ===================================================

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  // ===================================================
  // PROFILE COMPLETION
  // ===================================================

  if (
    !user.isProfileComplete &&
    user.role !== 'admin' &&
    window.location.pathname !== '/onboarding'
  ) {
    return (
      <Navigate
        to="/onboarding"
        replace
      />
    );
  }

  // ===================================================
  // DASHBOARD LAYOUT
  // ===================================================

  return (
    <div
      className="
        min-h-screen
        flex
        flex-col
        bg-transparent
      "
    >
      <Navbar />

      <div
        className="
          flex-1
          flex
          flex-col
          md:flex-row
          w-full
          max-w-[1600px]
          mx-auto
          bg-transparent
        "
      >
        <Sidebar />

        <main
          className="
            flex-1
            p-3
            sm:p-4
            lg:p-5
            xl:p-6
            overflow-x-hidden
            bg-transparent
            navta-main-content
          "
        >
          <Outlet />
        </main>
      </div>

      <Footer />
    </div>
  );
}

// =====================================================
// ROLE GUARD
// =====================================================

function RoleGuard({
  allowedRoles
}) {
  const {
    user,
    loading
  } = useAuth();

  if (loading) {
    return null;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    !allowedRoles.includes(
      user.role
    )
  ) {
    return (
      <Navigate
        to="/unauthorized"
        replace
      />
    );
  }

  return <Outlet />;
}

// =====================================================
// ROUTE LOADING FALLBACK
// =====================================================

function RouteLoader() {
  return (
    <div
      className="
        min-h-[50vh]
        w-full
        flex
        items-center
        justify-center
        bg-transparent
      "
      aria-live="polite"
      aria-label="Loading page"
    >
      <div
        className="
          h-8
          w-8
          animate-spin
          rounded-full
          border-4
          border-primary-500
          border-t-transparent
        "
      />
    </div>
  );
}

// =====================================================
// MAIN APP
// =====================================================

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<RouteLoader />}>
          <Routes>

          {/* =================================================
              PUBLIC ROUTES
          ================================================= */}

          <Route
            element={
              <PublicLayout />
            }
          >
            <Route
              path="/"
              element={
                <Home />
              }
            />

            <Route
              path="/about"
              element={
                <About />
              }
            />

            <Route
              path="/login"
              element={
                <Login />
              }
            />

            <Route
              path="/signup"
              element={
                <Signup />
              }
            />

            <Route
              path="/unauthorized"
              element={
                <Unauthorized />
              }
            />

            <Route
              path="/onboarding"
              element={
                <Onboarding />
              }
            />
          </Route>

          {/* =================================================
              SECURE DASHBOARD LAYOUT
          ================================================= */}

          <Route
            element={
              <DashboardLayout />
            }
          >

            {/* =================================================
                STUDENT ONLY
            ================================================= */}

            <Route
              element={
                <RoleGuard
                  allowedRoles={[
                    'student'
                  ]}
                />
              }
            >
              <Route
                path="/dashboard"
                element={
                  <StudentDashboard />
                }
              />

              <Route
                path="/mistake-notebook"
                element={
                  <MistakeNotebookPage />
                }
              />

              <Route
                path="/streak"
                element={
                  <StreakPage />
                }
              />

              <Route
                path="/analytics"
                element={
                  <AnalyticsPage />
                }
              />

              <Route
                path="/rewards"
                element={
                  <RewardsPage />
                }
              />

              <Route
                path="/results/:resultId"
                element={
                  <ResultDetail />
                }
              />
            </Route>

            {/* =================================================
                TEACHER ONLY
            ================================================= */}

            <Route
              element={
                <RoleGuard
                  allowedRoles={[
                    'teacher'
                  ]}
                />
              }
            >
              <Route
                path="/teacher"
                element={
                  <TeacherDashboard />
                }
              />
            </Route>

            {/* =================================================
                EXTERNAL TEACHER ONLY
            ================================================= */}

            <Route
              element={
                <RoleGuard
                  allowedRoles={[
                    'external_teacher'
                  ]}
                />
              }
            >
              <Route
                path="/external-teacher"
                element={
                  <ExternalTeacherDashboard />
                }
              />
            </Route>

            {/* =================================================
                QUESTION PAPER BUILDER
                TEACHER + EXTERNAL TEACHER + ADMIN
            ================================================= */}

            <Route
              element={
                <RoleGuard
                  allowedRoles={[
                    'teacher',
                    'external_teacher',
                    'admin'
                  ]}
                />
              }
            >
              <Route
                path="/teacher/question-paper-builder"
                element={
                  <QuestionPaperBuilder />
                }
              />

              <Route
                path="/educator/question-paper-builder"
                element={
                  <QuestionPaperBuilder />
                }
              />
            </Route>

            {/* =================================================
                ADMIN ONLY
            ================================================= */}

            <Route
              element={
                <RoleGuard
                  allowedRoles={[
                    'admin'
                  ]}
                />
              }
            >
              <Route
                path="/admin"
                element={
                  <AdminDashboard />
                }
              />

              <Route
                path="/admin/navta-test"
                element={
                  <AdminNavtaTest />
                }
              />

              {/* Admin can also open Question Paper Builder */}
              <Route
                path="/admin/question-paper-builder"
                element={
                  <QuestionPaperBuilder />
                }
              />
            </Route>

            {/* =================================================
                SHARED SECURE PAGES
            ================================================= */}

            <Route
              element={
                <RoleGuard
                  allowedRoles={[
                    'student',
                    'teacher',
                    'admin',
                    'external_teacher'
                  ]}
                />
              }
            >
              <Route
                path="/notes"
                element={
                  <NotesPage />
                }
              />

              <Route
                path="/pyqs"
                element={
                  <PYQPage />
                }
              />

              <Route
                path="/navta-test"
                element={
                  <NavtaTestPage />
                }
              />

              <Route
                path="/assessments"
                element={
                  <AssessmentPage />
                }
              />

              <Route
                path="/profile"
                element={
                  <ProfilePage />
                }
              />

              <Route
                path="/settings"
                element={
                  <SettingsPage />
                }
              />
            </Route>

          </Route>

          {/* =================================================
              CATCH ALL
          ================================================= */}

          <Route
            path="*"
            element={
              <Navigate
                to="/"
                replace
              />
            }
          />

          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
}
