import { useEffect, useState } from 'react';
import { api } from '@/shared/apiClient';

type Props = {
  children: React.ReactNode;
  allowed: Array<'student' | 'company' | 'garant'>;
};

function goToDashboard(role?: string) {
  switch (role) {
    case 'student':
      window.location.href = '/dashboard-student';
      return;
    case 'company':
      window.location.href = '/dashboard-company';
      return;
    case 'garant':
      window.location.href = '/dashboard-garant';
      return;
    default:
      window.location.href = '/login';
  }
}

export default function RequireRole({ children, allowed }: Props) {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        // U teba už existuje backend endpoint: GET /api/user (pozri backend/routes/api.php)
        const r = await api.get('/api/user');
        const role = r.data?.role as string | undefined;
        const must = !!r.data?.must_change_password;

        // ak musí meniť heslo, nepusti ho nikam inam
        if (must) {
          window.location.href = '/force-password';
          return;
        }

        // rola nesedí -> pošli ho na jeho dashboard
        if (!role || !allowed.includes(role as any)) {
          goToDashboard(role);
          return;
        }

        if (!alive) return;
        setOk(true);
      } catch (e: any) {
        // token chýba / 401 -> login
        window.location.href = '/login';
      }
    })();

    return () => {
      alive = false;
    };
  }, [allowed]);

  if (!ok) return null; // môžeš dať loader/spinner ak chceš
  return <>{children}</>;
}
