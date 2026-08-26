import React from 'react';

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

import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Unauthorized from './pages/Unauthorized';
import Onboarding from './pages/Onboarding';

// =====================================================
// PRIVATE PAGES
// =====================================================

import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import ExternalTeacherDashboard from './pages/ExternalTeacherDashboard';

import AdminDashboard from './pages/AdminDashboard';
import AdminNavtaTest from './pages/AdminNavtaTest';

import NavtaTestPage from './pages/NavtaTestPage';

import NotesPage from './pages/NotesPage';
import PYQPage from './pages/PYQPage';
import AssessmentPage from './pages/AssessmentPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import RewardsPage from './pages/RewardsPage';
import SettingsPage from './pages/SettingsPage';
import ResultDetail from './pages/ResultDetail';

// =====================================================
// PUBLIC LAYOUT
// =====================================================

function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-transparent">
      <Navbar />

      <main className="flex-1 bg-transparent">
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

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-transparent">
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

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

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
          max-w-7xl
          mx-auto
          bg-transparent
        "
      >
        <Sidebar />

        <main
          className="
            flex-1
            p-6
            overflow-x-hidden
            bg-transparent
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
// MAIN APP
// =====================================================

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>

          {/* =====================================================
              PUBLIC ROUTES
          ===================================================== */}

          <Route
            element={<PublicLayout />}
          >
            <Route
              path="/"
              element={<Home />}
            />

            <Route
              path="/about"
              element={<About />}
            />

            <Route
              path="/login"
              element={<Login />}
            />

            <Route
              path="/signup"
              element={<Signup />}
            />

            <Route
              path="/unauthorized"
              element={<Unauthorized />}
            />

            <Route
              path="/onboarding"
              element={<Onboarding />}
            />
          </Route>

          {/* =====================================================
              SECURE DASHBOARD LAYOUT
          ===================================================== */}

          <Route
            element={<DashboardLayout />}
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
                element={<StudentDashboard />}
              />

              <Route
                path="/analytics"
                element={<AnalyticsPage />}
              />

              <Route
                path="/rewards"
                element={<RewardsPage />}
              />

              <Route
                path="/results/:resultId"
                element={<ResultDetail />}
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
                element={<TeacherDashboard />}
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
                element={<ExternalTeacherDashboard />}
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
                element={<AdminDashboard />}
              />

              <Route
                path="/admin/navta-test"
                element={<AdminNavtaTest />}
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
                element={<NotesPage />}
              />

              <Route
                path="/pyqs"
                element={<PYQPage />}
              />

              <Route
                path="/navta-test"
                element={<NavtaTestPage />}
              />

              <Route
                path="/assessments"
                element={<AssessmentPage />}
              />

              <Route
                path="/profile"
                element={<ProfilePage />}
              />

              <Route
                path="/settings"
                element={<SettingsPage />}
              />
            </Route>

          </Route>

          {/* =====================================================
              CATCH ALL
          ===================================================== */}

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
      </Router>
    </AuthProvider>
  );
}
