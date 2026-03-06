import { Navigate, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import AdminUsersPage from './pages/AdminUsersPage';
import IndexPage from './pages/IndexPage';
import { getHomePathByRole } from './utils/authRedirect';

function HomeRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <p className="text-center text-slate-600">Cargando...</p>;
  }

  return <Navigate to={user ? getHomePathByRole(user.role) : '/login'} replace />;
}

export default function App() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-100 to-cyan-100 p-4 md:p-10">
      <div className="mx-auto max-w-6xl">
        <Routes>
          <Route path="/" element={<HomeRedirect />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </main>
  );
}
