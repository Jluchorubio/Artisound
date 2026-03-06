import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import AdminCoursesPage from './pages/AdminCoursesPage';
import IndexPage from './pages/IndexPage';
import StudentPage from './pages/StudentPage';
import ProfessorPage from './pages/ProfessorPage';
import DrawingPage from './pages/DrawingPage';
import LandingPage from './pages/LandingPage';
import { getHomePathByRole } from './utils/authRedirect';
import SpotifyFloatingWidget from './components/SpotifyFloatingWidget';

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="py-10 text-center text-zinc-300">Cargando...</p>;
  }

  return <Navigate to={user ? getHomePathByRole(user.role) : '/login'} replace />;
}

export default function App() {
  const location = useLocation();
  const isLanding = location.pathname === '/';
  const isAuth = location.pathname === '/login' || location.pathname === '/register';
  const isSpecial = isLanding || isAuth;

  return (
    <main className={isSpecial ? 'min-h-screen' : 'min-h-screen bg-[#050505] text-white'}>
      <div>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/redirect" element={<HomeRedirect />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/inicio"
            element={
              <ProtectedRoute>
                <IndexPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/estudiante"
            element={
              <ProtectedRoute roles={['USUARIO']}>
                <StudentPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/profesor"
            element={
              <ProtectedRoute roles={['PROFESOR']}>
                <ProfessorPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dibujos"
            element={
              <ProtectedRoute>
                <DrawingPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/users"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminUsersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/cursos"
            element={
              <ProtectedRoute roles={['ADMIN']}>
                <AdminCoursesPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <SpotifyFloatingWidget />
      </div>
    </main>
  );
}
