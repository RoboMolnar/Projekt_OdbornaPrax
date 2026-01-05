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
  practice_type?: 'standard' | 'employment';
};

type PracticeDetail = {
  id: number;
  student_firstname: string;
  student_lastname: string;
  student_email: string | null;
  program: string | null;

  // ✅ typ praxe
  practice_type?: 'standard' | 'employment';

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

type DocRow = {
  id: number;
  type: string | null;
  name: string;
  invoice_period: string | null;
  uploaded_at: string | null;

  // company review fields (pre výkaz)
  company_review_status?: 'pending' | 'approved' | 'rejected' | null;
  company_reviewed_at?: string | null;
  company_review_note?: string | null;
};

type DocsCompliance = { required: boolean; ok: boolean; reason: string | null };

const STATUS_CLASSES: Record<string, string> = {
  Odoslaná_na_schválenie: 'border-green-300 text-green-700 bg-green-50',
  Prebieha: 'border-green-500 text-green-800 bg-green-100',
  Schválená: 'border-emerald-300 text-emerald-700 bg-emerald-50',
  Ukončená: 'border-red-300 text-red-700 bg-red-50',
  Vnávrhu: 'border-red-300 text-red-700 bg-red-50',
  Vytvorená: 'border-green-300 text-green-800 bg-green-50',
  Potvrdená: 'border-green-500 text-green-800 bg-green-100',
  Zamietnutá: 'border-red-300 text-red-700 bg-red-50',
  Neschválená: 'border-red-300 text-red-700 bg-red-50',
  Obhájená: 'border-emerald-300 text-emerald-700 bg-emerald-50',
  Neobhájená: 'border-red-300 text-red-700 bg-red-50',
};

// Firma potrebuje filtrovať hlavne tieto
const ALL_STATES = ['Vytvorená', 'Potvrdená', 'Zamietnutá'] as const;

const breadcrumbs = [{ title: 'Dashboard firmy', href: '/dashboard-company' }];

// ⚠️ nastav podľa tvojej DB hodnoty v document_type.document_type_name pre výkaz
const REPORT_DOC_TYPE = 'PRACTICE_REPORT';

// ✅ NOVÉ: endpoint na upload výkazu firmou (backend čo sme riešili)
function companyUploadEndpoint(internshipId: number) {
  return `/api/company/internships/${internshipId}/documents`;
}

function reportStatusLabel(s?: DocRow['company_review_status']) {
  if (!s || s === 'pending') return 'Čaká na rozhodnutie firmy';
  if (s === 'approved') return 'Potvrdený firmou';
  if (s === 'rejected') return 'Zamietnutý firmou';
  return '—';
}

function reportStatusBadgeClass(s?: DocRow['company_review_status']) {
  if (!s || s === 'pending') return 'border-amber-300 text-amber-800 bg-amber-50';
  if (s === 'approved') return 'border-emerald-300 text-emerald-800 bg-emerald-50';
  if (s === 'rejected') return 'border-rose-300 text-rose-800 bg-rose-50';
  return 'border-slate-200 text-slate-700 bg-slate-50';
}

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

  const [contactMessage, setContactMessage] = useState('');
  const [contactSending, setContactSending] = useState(false);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);

  // --- Docs in detail
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [docsCompliance, setDocsCompliance] = useState<DocsCompliance | null>(null);

  // ✅ NOVÉ: upload výkazu firmou
  const [companyReportFile, setCompanyReportFile] = useState<File | null>(null);
  const [companyReportBusy, setCompanyReportBusy] = useState(false);

  // --- UI helper: kedy má firma vidieť tlačidlá v detaile
  const companyCanDecide = selected && ['Vytvorená', 'Potvrdená', 'Zamietnutá'].includes(selected.status);

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

  async function loadDocs(internshipId: number) {
    setDocsLoading(true);
    setDocsError(null);
    try {
      const res = await api.get(`/api/company/internships/${internshipId}/documents`);
      setDocs((res.data?.documents || []) as DocRow[]);
      setDocsCompliance((res.data?.employment_compliance || null) as DocsCompliance | null);
    } catch (e: any) {
      setDocsError(e?.response?.data?.message || 'Nepodarilo sa načítať doklady.');
    } finally {
      setDocsLoading(false);
    }
  }

  // ✅ NOVÉ: firma uploadne výkaz -> backend to uloží rovno ako approved
  async function uploadCompanyReport(internshipId: number) {
    if (!companyReportFile) return;

    setCompanyReportBusy(true);
    try {
      const fd = new FormData();
      fd.append('type', REPORT_DOC_TYPE);
      fd.append('file', companyReportFile);

      await api.post(companyUploadEndpoint(internshipId), fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setCompanyReportFile(null);
      await loadDocs(internshipId);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Nepodarilo sa nahrať výkaz.');
    } finally {
      setCompanyReportBusy(false);
    }
  }

  async function openDetail(id: number) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setSelected(null);

    // reset kontakt
    setContactMessage('');
    setContactError(null);
    setContactSuccess(null);

    // reset docs
    setDocs([]);
    setDocsCompliance(null);
    setDocsError(null);

    // reset upload výkazu firmou
    setCompanyReportFile(null);
    setCompanyReportBusy(false);

    try {
      const res = await api.get<PracticeDetail>(`/api/company/internships/${id}`);
      setSelected(res.data);

      // načítaj doklady pre detail
      await loadDocs(id);
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

    setContactMessage('');
    setContactError(null);
    setContactSuccess(null);

    setDocs([]);
    setDocsCompliance(null);
    setDocsError(null);

    setCompanyReportFile(null);
    setCompanyReportBusy(false);
  }

  async function approve(id: number) {
    try {
      await api.post(`/api/company/internships/${id}/approve`);
      await openDetail(id);
      await loadRows();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Nepodarilo sa potvrdiť prax.';
      alert(msg);
    }
  }

  async function reject(id: number) {
    try {
      await api.post(`/api/company/internships/${id}/reject`);
      await openDetail(id);
      await loadRows();
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Nepodarilo sa zamietnuť prax.';
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

  async function downloadDoc(documentId: number) {
    try {
      const res = await api.get(`/api/documents/${documentId}/download`, { responseType: 'blob' });

      let filename = `document_${documentId}`;
      const dispo = res.headers?.['content-disposition'] || res.headers?.['Content-Disposition'];
      if (dispo) {
        const match = /filename\*?=(?:UTF-8''|")?([^";\n]+)"?/i.exec(dispo);
        if (match?.[1]) filename = decodeURIComponent(match[1].replace(/"/g, '').trim());
      }

      const contentType = res.headers?.['content-type'] || 'application/octet-stream';
      const blob = new Blob([res.data], { type: contentType });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Nepodarilo sa stiahnuť súbor.');
    }
  }

  async function approveReport(documentId: number) {
    if (!selected) return;
    try {
      await api.post(`/api/company/documents/${documentId}/report-approve`, { note: null });
      await loadDocs(selected.id);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Nepodarilo sa potvrdiť výkaz.');
    }
  }

  async function rejectReport(documentId: number) {
    if (!selected) return;
    const note = window.prompt('Dôvod zamietnutia (voliteľné):') ?? '';
    try {
      await api.post(`/api/company/documents/${documentId}/report-reject`, {
        note: note.trim() ? note.trim() : null,
      });
      await loadDocs(selected.id);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Nepodarilo sa zamietnuť výkaz.');
    }
  }

  const years = useMemo(() => Array.from(new Set(rows.map((r) => r.year))).sort((a, b) => b - a), [rows]);
  const programs = useMemo(() => Array.from(new Set(rows.map((r) => r.program).filter(Boolean))) as string[], [rows]);

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

                          {/* ✅ BADGE: zamestnanie */}
                          {r.practice_type === 'employment' && (
                            <span className="ml-2 text-xs font-medium text-green-800 bg-green-100 border border-green-200 rounded px-2 py-0.5">
                              Zamestnanie
                            </span>
                          )}
                        </TableCell>
                        <TableCell>{r.program ?? '—'}</TableCell>
                        <TableCell>{r.year}</TableCell>
                        <TableCell>
                          <Badge className={STATUS_CLASSES[r.status] || 'border-green-300'}>{r.status}</Badge>
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
          <div className="w-full max-w-lg rounded-xl bg-white shadow-lg border border-green-200 p-6 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-green-900">
                  Detail praxe
                  {/* ✅ BADGE: zamestnanie aj v detaile */}
                  {selected?.practice_type === 'employment' && (
                    <span className="ml-2 text-xs font-medium text-green-800 bg-green-100 border border-green-200 rounded px-2 py-0.5">
                      Zamestnanie
                    </span>
                  )}
                </h2>

                {selected && (
                  <p className="text-sm text-green-600">
                    {selected.student_firstname} {selected.student_lastname} – {selected.program ?? '—'}
                  </p>
                )}
              </div>

              <button type="button" className="text-sm text-green-600 hover:text-green-800" onClick={closeDetail}>
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
                      <p className="text-green-600">{selected.student_email ?? 'bez emailu'}</p>
                    </div>

                    <div>
                      <p className="font-semibold text-green-700">Firma</p>
                      <p className="text-green-900">
                        {selected.company_name}
                        {selected.practice_type === 'employment' && (
                          <span className="ml-2 text-xs font-medium text-green-800 bg-green-100 border border-green-200 rounded px-2 py-0.5">
                            Zamestnanie
                          </span>
                        )}
                      </p>
                      <p className="text-green-600">
                        {[selected.street, selected.city, selected.zip, selected.country].filter(Boolean).join(', ') || '—'}
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
                      <p className="text-green-900">{selected.worked_hours ?? '—'}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-green-700">Stav</p>
                      <p className="text-green-900">{selected.status}</p>
                    </div>
                  </div>

                  {/* ✅ NOVÉ: Upload výkazu firmou (automaticky approved) */}
                  <div className="border-t pt-3 mt-3 space-y-2">
                    <p className="font-semibold text-green-800">Nahrať výkaz firmou</p>
                    <p className="text-xs text-green-700">
                      Po nahratí sa výkaz automaticky označí ako <span className="font-medium">potvrdený firmou</span>.
                    </p>

                    <div className="flex flex-col md:flex-row gap-2 md:items-center">
                      <Input type="file" onChange={(e) => setCompanyReportFile(e.target.files?.[0] ?? null)} />
                      <Button
                        type="button"
                        onClick={() => uploadCompanyReport(selected.id)}
                        disabled={!companyReportFile || companyReportBusy}
                        className="bg-green-700 hover:bg-green-800 text-white"
                      >
                        {companyReportBusy ? 'Nahrávam…' : 'Nahrať výkaz'}
                      </Button>
                    </div>
                  </div>

                  {/* ✅ DOKLADY – firma vidí zmluvu/výkaz/faktúry + stiahnuť,
                      a iba pre výkaz má potvrdiť/zamietnuť */}
                  <div className="border-t pt-3 mt-3 space-y-2">
                    <p className="font-semibold text-green-800">Doklady</p>

                    {docsCompliance && selected.practice_type === 'employment' && (
                      <p className={docsCompliance.ok ? 'text-green-700' : 'text-rose-700'}>
                        {docsCompliance.ok ? `✅ Splnené: ${docsCompliance.reason}` : `❌ Nesplnené: ${docsCompliance.reason}`}
                      </p>
                    )}

                    {docsLoading && <p className="text-green-700">Načítavam doklady…</p>}
                    {docsError && <p className="text-red-600">{docsError}</p>}

                    <div className="space-y-1">
                      {docs.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Zatiaľ nie sú nahraté žiadne doklady.</p>
                      ) : (
                        docs.map((d) => {
                          const isReport = d.type === REPORT_DOC_TYPE;

                          return (
                            <div key={d.id} className="flex items-start justify-between gap-2 border rounded-md px-3 py-2">
                              <div className="text-sm">
                                <div className="font-medium text-green-900">{d.name}</div>
                                <div className="text-green-700">
                                  {d.type}
                                  {d.invoice_period ? ` • ${d.invoice_period}` : ''}
                                  {d.uploaded_at ? ` • ${d.uploaded_at}` : ''}
                                </div>

                                {isReport && (
                                  <div className="mt-1">
                                    <Badge className={reportStatusBadgeClass(d.company_review_status)}>
                                      {reportStatusLabel(d.company_review_status)}
                                    </Badge>
                                    {d.company_review_note ? (
                                      <div className="text-xs text-green-700 mt-1">Poznámka: {d.company_review_note}</div>
                                    ) : null}
                                  </div>
                                )}
                              </div>

                              <div className="flex flex-col gap-2 items-end">
                                <Button variant="outline" size="sm" onClick={() => downloadDoc(d.id)}>
                                  Stiahnuť
                                </Button>

                                {isReport && (
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      className="bg-green-700 hover:bg-green-800 text-white"
                                      onClick={() => approveReport(d.id)}
                                      disabled={d.company_review_status === 'approved'}
                                      title={d.company_review_status === 'approved' ? 'Výkaz je už potvrdený' : undefined}
                                    >
                                      Potvrdiť výkaz
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      className="bg-green-100 text-green-800 hover:bg-green-200"
                                      onClick={() => rejectReport(d.id)}
                                      disabled={d.company_review_status === 'rejected'}
                                      title={d.company_review_status === 'rejected' ? 'Výkaz je už zamietnutý' : undefined}
                                    >
                                      Zamietnuť výkaz
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {selected.garant_email && (
                    <div className="border-t pt-3 mt-2 space-y-2">
                      <p className="font-semibold text-green-700">Kontaktovať garanta</p>
                      <p className="text-xs text-green-600">Správa bude odoslaná na: {selected.garant_email}</p>
                      <textarea
                        className="w-full rounded-md border border-green-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                        rows={3}
                        value={contactMessage}
                        onChange={(e) => setContactMessage(e.target.value)}
                        placeholder="Napíšte správu garantovi…"
                      />
                      {contactError && <p className="text-xs text-red-600">{contactError}</p>}
                      {contactSuccess && <p className="text-xs text-emerald-600">{contactSuccess}</p>}
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

                  {/* AKCIE FIRMY – iba v detaile */}
                  {companyCanDecide && (
                    <div className="border-t pt-3 mt-2 flex flex-wrap gap-2 justify-end">
                      <Button
                        size="sm"
                        className="bg-green-700 hover:bg-green-800 text-white"
                        onClick={() => approve(selected.id)}
                        disabled={selected.status === 'Potvrdená'}
                        title={selected.status === 'Potvrdená' ? 'Prax je už potvrdená' : undefined}
                      >
                        Potvrdiť
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="bg-green-100 text-green-800 hover:bg-green-200"
                        onClick={() => reject(selected.id)}
                        disabled={selected.status === 'Zamietnutá'}
                        title={selected.status === 'Zamietnutá' ? 'Prax je už zamietnutá' : undefined}
                      >
                        Zamietnuť
                      </Button>
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
