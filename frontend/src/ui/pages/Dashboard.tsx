import { useEffect, useState } from 'react';
import { api, clearAuthToken } from '@/shared/apiClient';

type User = { id: number; email: string; name: string; role: string };

export function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.get('/api/user')
      .then((res) => setUser(res.data))
      .catch(() => setError('Neprihlásený.'));
  }, []);

  if (error) {
    return (
      <div>
        <h1>Dashboard</h1>
        <p>{error} Prosím, <a href="/login">prihláste sa</a>.</p>
      </div>
    );
  }

  if (!user) {
    return <div>Načítavam...</div>;
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Vitajte, {user.name} ({user.email})</p>
      <p>Rola: {user.role}</p>
      <section style={{ marginTop: 12 }}>
        {user.role === 'student' && <p>Študentský dashboard</p>}
        {(user.role === 'company' || user.role === 'firma') && <p>Firemný dashboard</p>}
        {(user.role === 'garant' || user.role === 'teacher') && <p>Garant dashboard</p>}
      </section>
      <button onClick={async () => { await api.post('/api/logout'); clearAuthToken(); window.location.href = '/'; }}>Odhlásiť</button>
    </div>
  );
}
