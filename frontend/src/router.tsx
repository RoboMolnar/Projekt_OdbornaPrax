import { createBrowserRouter } from 'react-router-dom';
import Landing from '@/pages/landing';
import DashboardGarant from '@/pages/dashboard';
import DashboardStudent from '@/pages/dashboardStudent';
import DashboardCompany from '@/pages/dashboardCompany';
import Login from '@/pages/auth/login';
import Register from '@/pages/auth/register';
import ForcePassword from '@/pages/auth/force-password';

export const router = createBrowserRouter([
  { path: '/', element: <Landing /> },
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/force-password', element: <ForcePassword /> },
  { path: '/dashboard', element: <DashboardGarant /> },
  { path: '/dashboard-student', element: <DashboardStudent /> },
  { path: '/dashboard-company', element: <DashboardCompany /> },
  { path: '/dashboard-garant', element: <DashboardGarant /> },
]);
