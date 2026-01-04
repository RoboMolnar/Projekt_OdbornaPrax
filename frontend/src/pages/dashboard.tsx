import { useEffect, useMemo, useState } from 'react';
import AppLayoutSpa from '@/ui/AppLayoutSpa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api } from '@/shared/apiClient';

type PracticeRow = {
  id: number;
  student: string;
  program: string | null;
  firm: string;
  year: number;
  status: string;
};

type PracticeDetail = {
  id: number;
  student_firstname: string;
  student_lastname: string;
  student_email: string | null;
  program: string | null;
  company_name: string;
  street: string | null;
  city: string | null;
  zip: string | null;
  country: string | null;
  start_date: string;
  end_date: string;
  year: number;
  semester: string | number;
  worked_hours: number | null;
  status: string;
};

type Filter = { status: string; year: string; search: string; program: string };

const STATUS_CLASSES: Record<string, string> = {
  Vytvorená: 'border-slate-300 text-slate-700 bg-slate-50',
  Potvrdená: 'border-green-400 text-green-800 bg-green-50',
  Zamietnutá: 'border-rose-300 text-rose-700 bg-rose-50',
  Schválená: 'border-emerald-300 text-emerald-700 bg-emerald-50',
  Neschválená: 'border-rose-300 text-rose-700 bg-rose-50',
  Obhájená: 'border-emerald-300 text-emerald-700 bg-emerald-50',
  Neobhájená: 'border-rose-300 text-rose-700 bg-rose-50',
};

const ALL_STATES = ['Vytvorená', 'Potvrdená', 'Zamietnutá', 'Schválená', 'Neschválená', 'Obhájená', 'Neobhájená'] as const;

export default function DashboardGarant() {
  const [rows, setRows] = useState<PracticeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<Filter>({
    status: 'all',
    year: 'all',
    search: '',
    program: 'all',
  });

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PracticeDetail | null>(null);

  const [searchInput, setSearchInput] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setFilter((f) => ({ ...f, search: searchInput })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function loadRows() {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, string> = {};
      if (filter.status !== 'all') params.status = filter.status;
      if (filter.year !== 'all') params.year = filter.year;
      if (filter.program !== 'all') params.program = filter.program;
      if (filter.search.trim()) params.q = filter.search.trim();

      const res = await api.get<PracticeRow[]>('/api/garant/internships', { params });
      setRows(res.data);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Nepodarilo sa načítať praxe.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.status, filter.year, filter.program, filter.search]);

  async function openDetail(id: number) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setSelected(null);

    try {
      const res = await api.get<PracticeDetail>(`/api/garant/internships/${id}`);
      setSelected(res.data);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Nepodarilo sa načítať detail praxe.';
      setDetailError(msg);
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setDetailOpen(false);
    setSelected(null);
    setDetailError(null);
  }

  async function refreshDetail(id: number) {
    const res = await api.get<PracticeDetail>(`/api/garant/internships/${id}`);
    setSelected(res.data);
  }

  async function approve(id: number) {
    try {
      await api.post(`/api/garant/internships/${id}/approve`);
      await refreshDetail(id);
      await loadRows();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Nepodarilo sa schváliť prax.';
      alert(msg);
    }
  }

  async function reject(id: number) {
    try {
      await api.post(`/api/garant/internships/${id}/reject`);
      await refreshDetail(id);
      await loadRows();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Nepodarilo sa neschváliť prax.';
      alert(msg);
    }
  }

  async function grade(id: number, passed: boolean) {
    try {
      await api.post(`/api/garant/internships/${id}/grade`, { passed });
      await refreshDetail(id);
      await loadRows();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Nepodarilo sa uložiť hodnotenie.';
      alert(msg);
    }
  }

  const years = useMemo(
    () => Array.from(new Set(rows.map((r) => r.year))).sort((a, b) => b - a),
    [rows]
  );

  const programs = useMemo(
    () => Array.from(new Set(rows.map((r) => r.program).filter(Boolean))) as string[],
    [rows]
  );

  // garant môže preklikávať Schválená <-> Neschválená, kým nie je ohodnotené
  const canToggleDecision =
    selected?.status === 'Potvrdená' ||
    selected?.status === 'Schválená' ||
    selected?.status === 'Neschválená';

  // ✅ NOVÉ: ohodnotenie dovolíme aj keď už je Obhájená/Neobhájená
  const canGrade =
    selected?.status === 'Schválená' ||
    selected?.status === 'Obhájená' ||
    selected?.status === 'Neobhájená';

  return (
    <AppLayoutSpa breadcrumbs={[{ title: 'Dashboard garanta', href: '/dashboard' }]}>
      <div className="grid grid-cols-1 gap-4">
        <Card className="border border-green-400 bg-white/90 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-green-700">Prehľad praxí</CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col md:flex-row gap-2 md:items-center mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Hľadať študenta alebo firmu"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="border-green-300 focus:ring-green-500"
                />
              </div>

              <select
                className="border border-green-300 text-green-800 rounded-md px-3 py-2 text-sm"
                value={filter.status}
                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              >
                <option value="all">Všetky stavy</option>
                {ALL_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <select
                className="border border-green-300 text-green-800 rounded-md px-3 py-2 text-sm"
                value={filter.year}
                onChange={(e) => setFilter({ ...filter, year: e.target.value })}
              >
                <option value="all">Všetky roky</option>
                {years.map((y) => (
                  <option key={y} value={String(y)}>
                    {y}
                  </option>
                ))}
              </select>

              <select
                className="border border-green-300 text-green-800 rounded-md px-3 py-2 text-sm"
                value={filter.program}
                onChange={(e) => setFilter({ ...filter, program: e.target.value })}
              >
                <option value="all">Všetky odbory</option>
                {programs.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-red-600">{error}</p>}
            {!error && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Študent</TableHead>
                    <TableHead>Odbor</TableHead>
                    <TableHead>Firma</TableHead>
                    <TableHead>Rok</TableHead>
                    <TableHead>Stav</TableHead>
                    <TableHead className="text-right">Akcie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={6}>Načítavam…</TableCell>
                    </TableRow>
                  )}
                  {!loading && rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6}>Žiadne praxe sa nenašli.</TableCell>
                    </TableRow>
                  )}
                  {!loading &&
                    rows.map((r) => (
                      <TableRow key={r.id} className="hover:bg-green-50">
                        <TableCell>
                          <span className="text-green-900">{r.student || '—'}</span>
                        </TableCell>
                        <TableCell>{r.program ?? '—'}</TableCell>
                        <TableCell>{r.firm}</TableCell>
                        <TableCell>{r.year}</TableCell>
                        <TableCell>
                          <Badge className={STATUS_CLASSES[r.status] || 'border-green-300'}>
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-700 hover:bg-green-100"
                            onClick={() => openDetail(r.id)}
                          >
                            Detail
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-lg border border-green-200 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-green-800">Detail praxe</h2>
                {selected ? (
                  <p className="text-sm text-green-600">
                    {selected.student_firstname} {selected.student_lastname} – {selected.company_name}
                  </p>
                ) : (
                  <p className="text-sm text-green-600">Podrobné informácie o odbornej praxi.</p>
                )}
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="text-green-400 hover:text-green-600 text-xl leading-none"
                aria-label="Zavrieť"
              >
                ×
              </button>
            </div>

            <div className="mt-4 text-sm">
              {detailLoading && <p className="text-green-600">Načítavam…</p>}
              {detailError && <p className="text-red-600">{detailError}</p>}

              {!detailLoading && !detailError && selected && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="font-semibold text-green-700">Študent</p>
                      <p className="text-green-900">
                        {selected.student_firstname} {selected.student_lastname}
                        {selected.student_email ? (
                          <span className="block text-green-600">{selected.student_email}</span>
                        ) : null}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-green-700">Odbor</p>
                      <p className="text-green-900">{selected.program ?? '—'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-green-700">Firma</p>
                    <p className="text-green-900">{selected.company_name}</p>
                    <p className="text-green-600">
                      {[selected.street, selected.city, selected.zip, selected.country].filter(Boolean).join(', ') || '—'}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="font-semibold text-green-700">Začiatok</p>
                      <p className="text-green-900">{selected.start_date}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-green-700">Koniec</p>
                      <p className="text-green-900">{selected.end_date}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-green-700">Rok / Sem.</p>
                      <p className="text-green-900">
                        {selected.year} / {selected.semester}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="font-semibold text-green-700">Odpracované hodiny</p>
                      <p className="text-green-900">{selected.worked_hours ?? '—'}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-green-700">Stav</p>
                      <Badge className={STATUS_CLASSES[selected.status] || 'border-green-300'}>
                        {selected.status}
                      </Badge>
                    </div>
                  </div>

                  {/* AKCIE GARANTA – rozhodnutie (Schválená/Neschválená) */}
                  {canToggleDecision && (
                    <div className="border-t pt-3 mt-2 flex flex-wrap gap-2 justify-end">
                      {selected.status !== 'Schválená' && (
                        <Button
                          size="sm"
                          className="bg-green-700 hover:bg-green-800 text-white"
                          onClick={() => approve(selected.id)}
                        >
                          Schváliť
                        </Button>
                      )}

                      {selected.status !== 'Neschválená' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-green-100 text-green-800 hover:bg-green-200"
                          onClick={() => reject(selected.id)}
                        >
                          Neschváliť
                        </Button>
                      )}
                    </div>
                  )}

                  {/* ✅ OHODNOTENIE – aj po finále (prepínanie Obhájená ↔ Neobhájená) */}
                  {canGrade && (
                    <div className="border-t pt-3 mt-2 flex flex-wrap gap-2 justify-end">
                      {/* Ak je už Obhájená, zmysel má len prepnúť na Neobhájená */}
                      {selected.status !== 'Obhájená' && (
                        <Button
                          size="sm"
                          className="bg-green-700 hover:bg-green-800 text-white"
                          onClick={() => grade(selected.id, true)}
                        >
                          Obhájená
                        </Button>
                      )}

                      {/* Ak je už Neobhájená, zmysel má len prepnúť na Obhájená */}
                      {selected.status !== 'Neobhájená' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-green-100 text-green-800 hover:bg-green-200"
                          onClick={() => grade(selected.id, false)}
                        >
                          Neobhájená
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayoutSpa>
  );
}
