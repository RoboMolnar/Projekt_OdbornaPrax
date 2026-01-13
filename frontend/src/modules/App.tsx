import { useEffect, useState } from 'react';
import { api } from '@/shared/apiClient';

export function App() {
  const [status, setStatus] = useState<'idle'|'ok'|'error'>('idle');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    api.get('/api/health')
      .then((res) => {
        setStatus(res.data?.ok ? 'ok' : 'error');
        setMessage(JSON.stringify(res.data));
      })
      .catch((e) => {
        setStatus('error');
        setMessage(e?.message || 'Request failed');
      });
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <h1>Frontend (React + Vite)</h1>
      <p>API base: {import.meta.env.VITE_API_URL}</p>
      <p>
        Health: <strong>{status}</strong>
      </p>
      <pre style={{ background: '#f6f6f6', padding: 12 }}>{message}</pre>
    </div>
  );
}

