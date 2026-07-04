import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Layout & Navigation
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';

// Public Pages
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Unauthorized from './pages/Unauthorized';

// Private Pages
import StudentDashboard from './pages/StudentDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import AdminDashboard from './pages/AdminDashboard';
import NotesPage from './pages/NotesPage';
import PYQPage from './pages/PYQPage';
import AssessmentPage from './pages/AssessmentPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ProfilePage from './pages/ProfilePage';
import RewardsPage from './pages/RewardsPage';
import SettingsPage from './pages/SettingsPage';
import ResultDetail from './pages/ResultDetail';

// Distraction-free Layout for Public / Login Pages
function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B0F19]">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

// Sidebar-integrated Layout for dashboards and study libraries
function DashboardLayout() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50 dark:bg-darkbg">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#0B0F19]">
      <Navbar />
      <div className="flex-1 flex flex-col md:flex-row w-full max-w-7xl mx-auto">
        <Sidebar />
        <main className="flex-1 p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <Footer />
    </div>
  );
}

// Role-based Route Protection Guard
function RoleGuard({ allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) return null;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Views */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
          </Route>

          {/* Secure Dashboards and Study Areas */}
          <Route element={<DashboardLayout />}>
            {/* Student only pages */}
            <Route element={<RoleGuard allowedRoles={['student']} />}>
              <Route path="/dashboard" element={<StudentDashboard />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
              <Route path="/rewards" element={<RewardsPage />} />
              <Route path="/results/:resultId" element={<ResultDetail />} />
            </Route>

            {/* Teacher only pages */}
            <Route element={<RoleGuard allowedRoles={['teacher']} />}>
              <Route path="/teacher" element={<TeacherDashboard />} />
            </Route>

            {/* Admin only pages */}
            <Route element={<RoleGuard allowedRoles={['admin']} />}>
              <Route path="/admin" element={<AdminDashboard />} />
            </Route>

            {/* Shared Secure Pages (Student + Teacher + Admin) */}
            <Route element={<RoleGuard allowedRoles={['student', 'teacher', 'admin']} />}>
              <Route path="/notes" element={<NotesPage />} />
              <Route path="/pyqs" element={<PYQPage />} />
              <Route path="/assessments" element={<AssessmentPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
