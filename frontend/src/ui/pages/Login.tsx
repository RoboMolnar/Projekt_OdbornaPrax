import { FormEvent, useState } from 'react';
import { api } from '@/shared/apiClient';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.get('/sanctum/csrf-cookie');
      await api.post('/login', { email, password });
      window.location.href = '/dashboard';
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Prihlásenie zlyhalo');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 360 }}>
      <h1>Prihlásenie</h1>
      <form onSubmit={onSubmit}>
        <div style={{ display: 'grid', gap: 8 }}>
          <label>
            E-mail
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label>
            Heslo
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </label>
          <button disabled={busy} type="submit">{busy ? 'Prihlasujem...' : 'Prihlásiť sa'}</button>
          {error && <div style={{ color: 'crimson' }}>{error}</div>}
        </div>
      </form>
    </div>
  );
}

