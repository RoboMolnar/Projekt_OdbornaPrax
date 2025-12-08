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
  Vytvorená: 'border-green-300 text-green-700 bg-green-50',
  Schválená: 'border-emerald-300 text-emerald-700 bg-emerald-50',
  Obhájená: 'border-emerald-300 text-emerald-700 bg-emerald-50',
  Neobhájená: 'border-rose-300 text-rose-700 bg-rose-50',
  Zamietnutá: 'border-rose-300 text-rose-700 bg-rose-50',
};

const ALL_STATES = ['Vytvorená', 'Schválená', 'Zamietnutá', 'Obhájená', 'Neobhájená'] as const;

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
  const [pendingState, setPendingState] = useState<string>(''); // pre dropdown v detaile

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
    setPendingState('');
    try {
      const res = await api.get<PracticeDetail>(`/api/garant/internships/${id}`);
      setSelected(res.data);
      setPendingState(res.data.status); // predvyplniť aktuálny stav v dropdown-e
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
    setPendingState('');
  }

  async function approve(id: number) {
    try {
      await api.post(`/api/garant/internships/${id}/approve`);
      closeDetail();
      await loadRows();
    } catch {
      alert('Nepodarilo sa schváliť prax.');
    }
  }

  async function reject(id: number) {
    try {
      await api.post(`/api/garant/internships/${id}/reject`);
      closeDetail();
      await loadRows();
    } catch {
      alert('Nepodarilo sa zamietnuť prax.');
    }
  }

  async function grade(id: number, passed: boolean) {
    try {
      await api.post(`/api/garant/internships/${id}/grade`, { passed });
      closeDetail();
      await loadRows();
    } catch {
      alert('Nepodarilo sa uložiť hodnotenie.');
    }
  }

  async function changeState(id: number, state: string) {
    try {
      await api.patch(`/api/garant/internships/${id}/state`, { state });
      closeDetail();
      await loadRows();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Nepodarilo sa zmeniť stav.';
      alert(msg);
    }
  }

  async function removeInternship(id: number) {
    const ok = window.confirm('Naozaj chcete vymazať túto prax? Táto akcia je nevratná.');
    if (!ok) return;
    try {
      await api.delete(`/api/garant/internships/${id}`);
      if (selected?.id === id) closeDetail();
      await loadRows();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Prax sa nepodarilo vymazať.';
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
                <option value="Vytvorená">Vytvorená</option>
                <option value="Schválená">Schválená</option>
                <option value="Obhájená">Obhájená</option>
                <option value="Neobhájená">Neobhájená</option>
                <option value="Zamietnutá">Zamietnutá</option>
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
                        <TableCell className="text-right space-x-2">
                          {r.status === 'Vytvorená' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-700 hover:bg-green-800 text-white"
                                onClick={() => approve(r.id)}
                              >
                                Schváliť
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="bg-green-100 text-green-800 hover:bg-green-200"
                                onClick={() => reject(r.id)}
                              >
                                Zamietnuť
                              </Button>
                            </>
                          )}
                          {r.status === 'Schválená' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-700 hover:bg-green-800 text-white"
                                onClick={() => grade(r.id, true)}
                              >
                                Ohodnotiť: Prešiel
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                className="bg-green-100 text-green-800 hover:bg-green-200"
                                onClick={() => grade(r.id, false)}
                              >
                                Neprešiel
                              </Button>
                            </>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-green-700 hover:bg-green-100"
                            onClick={() => openDetail(r.id)}
                          >
                            Detail
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => removeInternship(r.id)}
                          >
                            Vymazať
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
                <p className="text-sm text-green-600">Podrobné informácie o odbornej praxi.</p>
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
                          <span className="block text-green-600">
                            {selected.student_email}
                          </span>
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
                      {[selected.street, selected.city, selected.zip, selected.country]
                        .filter(Boolean)
                        .join(', ') || '—'}
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end pt-2">
                    <div className="md:col-span-2">
                      <label className="block text-green-700 font-semibold mb-1">
                        Zmeniť stav
                      </label>
                      <select
                        className="w-full border border-green-300 rounded-md px-3 py-2 text-sm text-green-800"
                        value={pendingState}
                        onChange={(e) => setPendingState(e.target.value)}
                      >
                        {ALL_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-xs text-green-600">
                        Uloženie stavu teraz automaticky zatvorí detail.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        className="w-full bg-green-700 hover:bg-green-800 text-white"
                        onClick={() => selected && changeState(selected.id, pendingState)}
                        disabled={!pendingState || pendingState === selected.status}
                      >
                        Uložiť stav
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-4">
                    {selected.status === 'Vytvorená' && (
                      <>
                        <Button
                          className="bg-green-700 hover:bg-green-800 text-white"
                          onClick={() => approve(selected.id)}
                        >
                          Schváliť
                        </Button>
                        <Button
                          variant="secondary"
                          className="bg-green-100 text-green-800 hover:bg-green-200"
                          onClick={() => reject(selected.id)}
                        >
                          Zamietnuť
                        </Button>
                      </>
                    )}
                    {selected.status === 'Schválená' && (
                      <>
                        <Button
                          className="bg-green-700 hover:bg-green-800 text-white"
                          onClick={() => grade(selected.id, true)}
                        >
                          Ohodnotiť: Prešiel
                        </Button>
                        <Button
                          variant="secondary"
                          className="bg-green-100 text-green-800 hover:bg-green-200"
                          onClick={() => grade(selected.id, false)}
                        >
                          Neprešiel
                        </Button>
                      </>
                    )}
                    <Button
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => removeInternship(selected.id)}
                    >
                      Vymazať
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppLayoutSpa>
  );
}
