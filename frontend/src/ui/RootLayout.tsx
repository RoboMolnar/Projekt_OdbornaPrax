import { Link, Outlet } from 'react-router-dom';

export function RootLayout() {
  return (
    <div style={{ fontFamily: 'system-ui, sans-serif' }}>
      <header style={{ display: 'flex', gap: 12, padding: 12, borderBottom: '1px solid #eee' }}>
        <Link to="/">Home</Link>
        <Link to="/dashboard">Dashboard</Link>
        <Link to="/login">Login</Link>
      </header>
      <main style={{ padding: 24 }}>
        <Outlet />
      </main>
    </div>
  );
}

