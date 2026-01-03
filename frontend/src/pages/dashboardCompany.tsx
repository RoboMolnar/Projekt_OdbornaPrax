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
  garant_email: string | null;
};

type Filter = { status: string; year: string; search: string; program: string };

const STATUS_CLASSES: Record<string, string> = {
  Odoslaná_na_schválenie: 'border-green-300 text-green-700 bg-green-50',
  Prebieha: 'border-green-500 text-green-800 bg-green-100',
  Schválená: 'border-emerald-300 text-emerald-700 bg-emerald-50',
  Ukončená: 'border-red-300 text-red-700 bg-red-50',
  Vnávrhu: 'border-red-300 text-red-700 bg-red-50',

};

const ALL_STATES = ['Odoslaná na schválenie','Schválená', 'Zamietnutá',] as const;
const breadcrumbs = [{ title: 'Dashboard firmy', href: '/dashboard-company' }];

export default function DashboardCompany() {
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
  const [pendingState, setPendingState] = useState<string>('');

  const [contactMessage, setContactMessage] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

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

      const res = await api.get<PracticeRow[]>('/api/company/internships', { params });
      setRows(res.data);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Nepodarilo sa načítať praxe.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.title = 'Dashboard firmy';
  }, []);

  useEffect(() => {
    loadRows();
  }, [filter.status, filter.year, filter.program, filter.search]);

  async function openDetail(id: number) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setSelected(null);
    setPendingState('');
    setContactMessage('');
    setContactError(null);
    setContactSuccess(null);

    try {
      const res = await api.get<PracticeDetail>(`/api/company/internships/${id}`);
      setSelected(res.data);
      setPendingState(res.data.status);
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
    setContactMessage('');
    setContactError(null);
    setContactSuccess(null);
  }

  async function approve(id: number) {
    try {
      await api.post(`/api/company/internships/${id}/approve`);
      closeDetail();
      await loadRows();
    } catch {
      alert('Nepodarilo sa schváliť prax.');
    }
  }

  async function reject(id: number) {
    try {
      await api.post(`/api/company/internships/${id}/reject`);
      closeDetail();
      await loadRows();
    } catch {
      alert('Nepodarilo sa zamietnuť prax.');
    }
  }

  async function grade(id: number, passed: boolean) {
    try {
      await api.post(`/api/company/internships/${id}/grade`, { passed });
      closeDetail();
      await loadRows();
    } catch {
      alert('Nepodarilo sa uložiť hodnotenie.');
    }
  }

  async function changeState(id: number, state: string) {
    try {
      await api.patch(`/api/company/internships/${id}/state`, { state });
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
      await api.delete(`/api/company/internships/${id}`);
      if (selected?.id === id) closeDetail();
      await loadRows();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Prax sa nepodarilo vymazať.';
      alert(msg);
    }
  }

  async function sendMessageToGarant(id: number) {
    if (!contactMessage.trim()) {
      setContactError('Zadajte text správy.');
      return;
    }
    try {
      setContactSending(true);
      setContactError(null);
      setContactSuccess(null);

      await api.post(`/api/company/internships/${id}/contact-garant`, {
        message: contactMessage.trim(),
      });

      setContactMessage('');
      setContactSuccess('Správa bola odoslaná garantovi.');
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Správu sa nepodarilo odoslať.';
      setContactError(msg);
    } finally {
      setContactSending(false);
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
    <AppLayoutSpa breadcrumbs={breadcrumbs}>
      <div className="grid grid-cols-1 gap-4">
        <Card className="border border-green-400 bg-white/90 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-3">
            <div>
              <CardTitle className="text-green-800">Prehľad praxí vo firme</CardTitle>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col md:flex-row gap-2 md:items-center mb-4">
              <div className="flex-1">
                <Input
                  placeholder="Hľadať študenta alebo odbor"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="border-green-300 focus:ring-green-500"
                />
              </div>

              <select
                className="border-green-300 text-green-800 rounded-md px-3 py-2 text-sm"
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
                className="border-green-300 text-green-800 rounded-md px-3 py-2 text-sm"
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
                className="border-green-300 text-green-800 rounded-md px-3 py-2 text-sm"
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
                    <TableHead>Rok</TableHead>
                    <TableHead>Stav</TableHead>
                    <TableHead className="text-right">Akcie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading && (
                    <TableRow>
                      <TableCell colSpan={5}>Načítavam…</TableCell>
                    </TableRow>
                  )}
                  {!loading && rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5}>Žiadne praxe sa nenašli.</TableCell>
                    </TableRow>
                  )}
                  {!loading &&
                    rows.map((r) => (
                      <TableRow key={r.id} className="hover:bg-green-50">
                        <TableCell>
                          <span className="text-green-900">{r.student || '—'}</span>
                        </TableCell>
                        <TableCell>{r.program ?? '—'}</TableCell>
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

    {/*                        <Button
                            size="sm"
                            variant="destructive"
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={() => removeInternship(r.id)}
                          >
                            Vymazať
                          </Button> */}
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
                <h2 className="text-lg font-semibold text-green-900">Detail praxe</h2>
                {selected && (
                  <p className="text-sm text-green-600">
                    {selected.student_firstname} {selected.student_lastname} –{' '}
                    {selected.program ?? '—'}
                  </p>
                )}
              </div>
              <button
                type="button"
                className="text-sm text-green-600 hover:text-green-800"
                onClick={closeDetail}
              >
                Zavrieť
              </button>
            </div>

            <div className="mt-4">
              {detailLoading && <p>Načítavam detail…</p>}
              {detailError && <p className="text-red-600">{detailError}</p>}
              {!detailLoading && selected && !detailError && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="font-semibold text-green-700">Študent</p>
                      <p className="text-green-900">
                        {selected.student_firstname} {selected.student_lastname}
                      </p>
                      <p className="text-green-600">
                        {selected.student_email ?? 'bez emailu'}
                      </p>
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
                      <p className="text-green-900">
                        {selected.worked_hours ?? '—'}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-green-700">Stav</p>
                      <p className="text-green-900">{selected.status}</p>
                    </div>
                  </div>

                  {selected.garant_email && (
                    <div className="border-t pt-3 mt-2 space-y-2">
                      <p className="font-semibold text-green-700">Kontaktovať garanta</p>
                      <p className="text-xs text-green-600">
                        Správa bude odoslaná na: {selected.garant_email}
                      </p>
                      <textarea
                        className="w-full rounded-md border border-green-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        rows={3}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Napíšte správu garantovi…"
                      />
                      {contactError && (
                        <p className="text-xs text-red-600">{contactError}</p>
                      )}
                      {contactSuccess && (
                        <p className="text-xs text-emerald-600">{contactSuccess}</p>
                      )}
                      <Button
                        size="sm"
                        onClick={() => sendMessageToGarant(selected.id)}
                        disabled={contactSending}
                        className="bg-green-700 hover:bg-green-800 text-white"
                      >
                        {contactSending ? 'Odosielam…' : 'Odoslať správu garantovi'}
                      </Button>
                    </div>
                  )}

                  <div className="border-t pt-3 mt-2 flex flex-wrap gap=2">
                    {ALL_STATES.includes(selected.status as any) && (
                      <select
                        className="border-green-300 text-green-800 rounded-md px-3 py-2 text-sm"
                        value={pendingState}
                        onChange={(e) => setPendingState(e.target.value)}
                      >
                        <option value="">Zmeniť stav…</option>
                        {ALL_STATES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    )}
                    {pendingState && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => changeState(selected.id, pendingState)}
                        className="bg-green-100 text-green-800 hover:bg-green-200"
                      >
                        Uložiť stav
                      </Button>
                    )}

                    {selected.status === 'Vytvorená' && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-700 hover:bg-green-800 text-white"
                          onClick={() => approve(selected.id)}
                        >
                          Schváliť
                        </Button>
                        <Button
                          size="sm"
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
                  {/*      <Button
                          size="sm"
                          className="bg-green-700 hover:bg-green-800 text-white"
                          onClick={() => grade(selected.id, true)}
                        >
                          Ohodnotiť: Prešiel
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="bg-green-100 text-green-800 hover:bg-green-200"
                          onClick={() => grade(selected.id, false)}
                        >
                          Neprešiel
                        </Button> */}
                      </>
                    )}

  {/*                  <Button
                      size="sm"
                      variant="destructive"
                      className="bg-red-600 hover:bg-red-700 text-white"
                      onClick={() => removeInternship(selected.id)}
                    >
                      Vymazať
                    </Button> */}
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
