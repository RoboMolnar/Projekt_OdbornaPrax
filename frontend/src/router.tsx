import { createBrowserRouter } from 'react-router-dom';
import Landing from '@/pages/landing';
import DashboardGarant from '@/pages/dashboard';
import DashboardStudent from '@/pages/dashboardStudent';
import DashboardCompany from '@/pages/dashboardCompany';
import Login from '@/pages/auth/login';
import Register from '@/pages/auth/register';
import ForcePassword from '@/pages/auth/force-password';
import RequireRole from '@/shared/RequireRole';
import ChangePassword from '@/pages/auth/change-password';
import ForgotPassword from '@/pages/auth/forgot-password';
import ResetPassword from '@/pages/auth/reset-password';

export const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },

  // Zabudnuté heslo (bez prihlásenia)
  { path: '/forgot-password', element: <ForgotPassword /> },
  { path: '/reset-password', element: <ResetPassword /> },

  { path: '/force-password', element: <ForcePassword /> },

  // Zmena hesla – pre všetkých prihlásených
  {
    path: '/change-password',
    element: (
      <RequireRole allowed={['student', 'company', 'garant']}>
        <ChangePassword />
      </RequireRole>
    ),
  },

  // Garant dashboard
  {
    path: '/dashboard',
    element: (
      <RequireRole allowed={['garant']}>
        <DashboardGarant />
      </RequireRole>
    ),
  },
  {
    path: '/dashboard-garant',
    element: (
      <RequireRole allowed={['garant']}>
        <DashboardGarant />
      </RequireRole>
    ),
  },

  // Student dashboard
  {
    path: '/dashboard-student',
    element: (
      <RequireRole allowed={['student']}>
        <DashboardStudent />
      </RequireRole>
    ),
  },

  // Company dashboard
  {
    path: '/dashboard-company',
    element: (
      <RequireRole allowed={['company']}>
        <DashboardCompany />
      </RequireRole>
    ),
  },
]);
