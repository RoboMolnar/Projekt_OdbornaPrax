import { useEffect, useMemo, useState } from 'react';
import AppLayoutSpa from '@/ui/AppLayoutSpa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { api } from '@/shared/apiClient';

type PracticeRow = {
  id: number;
  student: string;
  program: string | null;
  firm: string;
  year: number;
  status: string;
  practice_type?: 'standard' | 'employment';
};

type PracticeDetail = {
  id: number;
  practice_type: 'standard' | 'employment';

  // ✅ potrebné pre autocomplete + update
  student_user_id: number;
  company_id: number;

  student_firstname: string;
  student_lastname: string;
  student_email: string | null;
  program: string | null;

  company_name: string;
  street: string | null;
  city: string | null;
  zip: string | null;
  country: string | null;

  company_contact_name?: string | null;
  company_contact_phone?: string | null;
  company_contact_email?: string | null;

  start_date: string;
  end_date: string;
  year: number;
  semester: string | number;
  worked_hours: number | null;
  status: string;
};

// ✅ bez q/search
type Filter = {
  status: string;
  year: 'all' | number;
  program: string;

  student_user_id: number | null;
  company_id: number | null;
};

type DocsCompliance = { required: boolean; ok: boolean; reason: string | null };

type DocRow = {
  id: number;
  type: string | null;
  name: string;
  invoice_period: string | null;
  uploaded_at: string | null;
  company_review_status?: 'approved' | 'rejected' | null;
  company_reviewed_at?: string | null;
  company_review_note?: string | null;
};

type SearchOption = { id: number; label: string };

const ALL_STATES = [
  'Vytvorená',
  'Potvrdená',
  'Zamietnutá',
  'Schválená',
  'Neschválená',
  'Obhájená',
  'Neobhájená',
] as const;

const STATUS_BADGE: Record<string, string> = {
  Vytvorená: 'border-green-300 text-green-800 bg-green-50',
  Potvrdená: 'border-green-500 text-green-800 bg-green-100',
  Zamietnutá: 'border-red-300 text-red-700 bg-red-50',
  Schválená: 'border-emerald-300 text-emerald-700 bg-emerald-50',
  Neschválená: 'border-red-300 text-red-700 bg-red-50',
  Obhájená: 'border-emerald-300 text-emerald-700 bg-emerald-50',
  Neobhájená: 'border-red-300 text-red-700 bg-red-50',
};

type EditPayload = {
  street: string | null;
  city: string | null;
  zip: string | null;
  country: string | null;

  start_date: string;
  end_date: string;
  year: number;
  semester: '1' | '2';
  worked_hours: number | null;

  // ✅ garant môže meniť aj firmu/študenta
  student_user_id: number;
  company_id: number;
};

function detailToEdit(d: PracticeDetail): EditPayload {
  return {
    street: d.street ?? null,
    city: d.city ?? null,
    zip: d.zip ?? null,
    country: d.country ?? null,
    start_date: d.start_date,
    end_date: d.end_date,
    year: d.year,
    semester: String(d.semester) as '1' | '2',
    worked_hours: d.worked_hours ?? null,
    student_user_id: d.student_user_id ?? 0,
    company_id: d.company_id ?? 0,
  };
}

function debounce<T extends (...args: any[]) => void>(fn: T, waitMs: number) {
  let t: any;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), waitMs);
  };
}

// ✅ odstráni posledné zátvorky, napr. "Ján Novák (jan@...)" -> "Ján Novák"
function stripTrailingParens(label: string) {
  return (label || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
}

export default function DashboardGarant() {
  const [rows, setRows] = useState<PracticeRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<Filter>({
    status: 'all',
    year: 'all',
    program: 'all',
    student_user_id: null,
    company_id: null,
  });

  // ✅ presné filtre (UI texty + výsledky)
  const [listStudentQuery, setListStudentQuery] = useState('');
  const [listStudentOptions, setListStudentOptions] = useState<SearchOption[]>([]);
  const [listStudentOpen, setListStudentOpen] = useState(false);
  const [listStudentLoading, setListStudentLoading] = useState(false);

  const [listCompanyQuery, setListCompanyQuery] = useState('');
  const [listCompanyOptions, setListCompanyOptions] = useState<SearchOption[]>([]);
  const [listCompanyOpen, setListCompanyOpen] = useState(false);
  const [listCompanyLoading, setListCompanyLoading] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PracticeDetail | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [edit, setEdit] = useState<EditPayload | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [downloadingCsv, setDownloadingCsv] = useState(false);

  // docs
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);
  const [docsCompliance, setDocsCompliance] = useState<DocsCompliance | null>(null);

  // ✅ autocomplete state (student) – detail edit
  const [studentQuery, setStudentQuery] = useState('');
  const [studentOptions, setStudentOptions] = useState<SearchOption[]>([]);
  const [studentOpen, setStudentOpen] = useState(false);
  const [studentLoading, setStudentLoading] = useState(false);

  // ✅ autocomplete state (company) – detail edit
  const [companyQuery, setCompanyQuery] = useState('');
  const [companyOptions, setCompanyOptions] = useState<SearchOption[]>([]);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [companyLoading, setCompanyLoading] = useState(false);

  useEffect(() => {
    document.title = 'Garant – praxe';
  }, []);

  function buildParamsFromFilter(f: Filter) {
    const params: Record<string, any> = {};
    if (f.status !== 'all') params.status = f.status;
    if (f.year !== 'all') params.year = f.year;
    if (f.program !== 'all') params.program = f.program;

    // ✅ presné filtre
    if (f.student_user_id) params.student_user_id = f.student_user_id;
    if (f.company_id) params.company_id = f.company_id;

    return params;
  }

  async function loadRows() {
    setLoading(true);
    setError(null);
    try {
      const params = buildParamsFromFilter(filter);
      const res = await api.get<PracticeRow[]>('/api/garant/internships', { params });
      setRows(res.data);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Nepodarilo sa načítať praxe.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRows();
  }, [filter.status, filter.year, filter.program, filter.student_user_id, filter.company_id]);

  const years = useMemo(() => Array.from(new Set(rows.map((r) => r.year))).sort((a, b) => b - a), [rows]);
  const programs = useMemo(
    () => Array.from(new Set(rows.map((r) => r.program).filter(Boolean))) as string[],
    [rows]
  );

  function closeDetail() {
    setDetailOpen(false);
    setSelected(null);
    setDetailError(null);
    setIsEditing(false);
    setEdit(null);
    setEditError(null);

    setDocs([]);
    setDocsError(null);
    setDocsCompliance(null);

    // autocomplete reset (detail)
    setStudentQuery('');
    setStudentOptions([]);
    setStudentOpen(false);
    setStudentLoading(false);

    setCompanyQuery('');
    setCompanyOptions([]);
    setCompanyOpen(false);
    setCompanyLoading(false);
  }

  async function refreshDetail(id: number) {
    await openDetail(id);
    await loadRows();
  }

  async function saveEdit() {
    if (!selected || !edit) return;

    setSavingEdit(true);
    setEditError(null);
    try {
      await api.patch(`/api/garant/internships/${selected.id}`, {
        street: edit.street,
        city: edit.city,
        zip: edit.zip,
        country: edit.country,
        start_date: edit.start_date,
        end_date: edit.end_date,
        year: edit.year,
        semester: edit.semester,
        worked_hours: edit.worked_hours,

        student_user_id: edit.student_user_id,
        company_id: edit.company_id,
      });

      setIsEditing(false);
      await refreshDetail(selected.id);
    } catch (e: any) {
      setEditError(e?.response?.data?.message || 'Nepodarilo sa uložiť zmeny.');
    } finally {
      setSavingEdit(false);
    }
  }

  async function loadDocsForGarant(internshipId: number) {
    setDocsLoading(true);
    setDocsError(null);
    try {
      const res = await api.get(`/api/garant/internships/${internshipId}/documents`);
      setDocs((res.data?.documents || []) as DocRow[]);
      setDocsCompliance((res.data?.employment_compliance || null) as DocsCompliance | null);
    } catch (e: any) {
      setDocsError(e?.response?.data?.message || 'Nepodarilo sa načítať doklady.');
    } finally {
      setDocsLoading(false);
    }
  }

  async function deleteDocForGarant(documentId: number, internshipId: number) {
    const ok = window.confirm('Naozaj chceš zmazať tento doklad?');
    if (!ok) return;

    try {
      await api.delete(`/api/garant/documents/${documentId}`);
      await loadDocsForGarant(internshipId);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Nepodarilo sa zmazať doklad.');
    }
  }

  async function downloadDoc(documentId: number) {
    try {
      const res = await api.get(`/api/documents/${documentId}/download`, {
        responseType: 'blob',
      });

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

  async function openDetail(id: number) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setSelected(null);

    setDocs([]);
    setDocsError(null);
    setDocsCompliance(null);

    // autocomplete reset (detail)
    setStudentQuery('');
    setStudentOptions([]);
    setStudentOpen(false);
    setStudentLoading(false);

    setCompanyQuery('');
    setCompanyOptions([]);
    setCompanyOpen(false);
    setCompanyLoading(false);

    try {
      const res = await api.get<PracticeDetail>(`/api/garant/internships/${id}`);
      setSelected(res.data);

      setIsEditing(false);
      const e = detailToEdit(res.data);
      setEdit(e);
      setEditError(null);

      // ✅ predvyplnenie inputov (bez emailu v zátvorke)
      const studentLabel = `${res.data.student_firstname ?? ''} ${res.data.student_lastname ?? ''}`.trim();
      setStudentQuery(studentLabel);
      setCompanyQuery(res.data.company_name ?? '');

      await loadDocsForGarant(id);
    } catch (e: any) {
      setDetailError(e?.response?.data?.message || 'Nepodarilo sa načítať detail praxe.');
    } finally {
      setDetailLoading(false);
    }
  }

  async function approve(id: number) {
    try {
      await api.post(`/api/garant/internships/${id}/approve`);
      await refreshDetail(id);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Nepodarilo sa schváliť.');
    }
  }

  async function reject(id: number) {
    try {
      await api.post(`/api/garant/internships/${id}/reject`);
      await refreshDetail(id);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Nepodarilo sa neschváliť.');
    }
  }

  async function grade(id: number, state: 'Obhájená' | 'Neobhájená') {
    try {
      await api.post(`/api/garant/internships/${id}/grade`, { state });
      await refreshDetail(id);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Nepodarilo sa uložiť výsledok obhajoby.');
    }
  }

  async function downloadCsv() {
    setDownloadingCsv(true);
    try {
      const params = buildParamsFromFilter(filter);

      const res = await api.get('/api/garant/internships/export', { params, responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `praxe_garant.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Nepodarilo sa stiahnuť CSV.');
    } finally {
      setDownloadingCsv(false);
    }
  }

  // ✅ autocomplete fetch (student) – detail edit
  const fetchStudents = useMemo(
    () =>
      debounce(async (q: string) => {
        const query = q.trim();
        if (query.length < 2) {
          setStudentOptions([]);
          setStudentLoading(false);
          return;
        }
        setStudentLoading(true);
        try {
          const res = await api.get<SearchOption[]>('/api/garant/students/search', { params: { q: query } });
          setStudentOptions(res.data || []);
        } catch {
          setStudentOptions([]);
        } finally {
          setStudentLoading(false);
        }
      }, 250),
    []
  );

  // ✅ autocomplete fetch (company) – detail edit
  const fetchCompanies = useMemo(
    () =>
      debounce(async (q: string) => {
        const query = q.trim();
        if (query.length < 2) {
          setCompanyOptions([]);
          setCompanyLoading(false);
          return;
        }
        setCompanyLoading(true);
        try {
          const res = await api.get<SearchOption[]>('/api/garant/companies/search', { params: { q: query } });
          setCompanyOptions(res.data || []);
        } catch {
          setCompanyOptions([]);
        } finally {
          setCompanyLoading(false);
        }
      }, 250),
    []
  );

  useEffect(() => {
    if (!isEditing) return;
    fetchStudents(studentQuery);
  }, [studentQuery, isEditing, fetchStudents]);

  useEffect(() => {
    if (!isEditing) return;
    fetchCompanies(companyQuery);
  }, [companyQuery, isEditing, fetchCompanies]);

  // ✅ autocomplete fetch – LIST filters (oddelené stavy, aby sa nemiešali s detailom)
  const fetchListStudents = useMemo(
    () =>
      debounce(async (q: string) => {
        const query = q.trim();
        if (query.length < 2) {
          setListStudentOptions([]);
          setListStudentLoading(false);
          return;
        }
        setListStudentLoading(true);
        try {
          const res = await api.get<SearchOption[]>('/api/garant/students/search', { params: { q: query } });
          setListStudentOptions(res.data || []);
        } catch {
          setListStudentOptions([]);
        } finally {
          setListStudentLoading(false);
        }
      }, 250),
    []
  );

  const fetchListCompanies = useMemo(
    () =>
      debounce(async (q: string) => {
        const query = q.trim();
        if (query.length < 2) {
          setListCompanyOptions([]);
          setListCompanyLoading(false);
          return;
        }
        setListCompanyLoading(true);
        try {
          const res = await api.get<SearchOption[]>('/api/garant/companies/search', { params: { q: query } });
          setListCompanyOptions(res.data || []);
        } catch {
          setListCompanyOptions([]);
        } finally {
          setListCompanyLoading(false);
        }
      }, 250),
    []
  );

  useEffect(() => {
    if (!listStudentOpen) return;
    fetchListStudents(listStudentQuery);
  }, [listStudentQuery, listStudentOpen, fetchListStudents]);

  useEffect(() => {
    if (!listCompanyOpen) return;
    fetchListCompanies(listCompanyQuery);
  }, [listCompanyQuery, listCompanyOpen, fetchListCompanies]);

  const canApprove = selected?.status === 'Potvrdená' || selected?.status === 'Neschválená';
  const canReject = selected?.status === 'Potvrdená' || selected?.status === 'Schválená';
  const canGrade = selected?.status === 'Schválená' || selected?.status === 'Obhájená' || selected?.status === 'Neobhájená';

  return (
    <AppLayoutSpa>
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Garant – evidované praxe</CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* ✅ poradie: študent, firma, stav, rok, odbor */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              {/* ✅ Študent (presne) – bez zátvoriek */}
              <div className="relative">
                <label className="text-sm text-muted-foreground">Študent</label>
                <Input
                  className="mt-1"
                  value={listStudentQuery}
                  placeholder="Začni písať…"
                  onFocus={() => setListStudentOpen(true)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setListStudentQuery(v);
                    setListStudentOpen(true);

                    // keď začne písať, zruš presný filter (lebo už to nie je “vybraté id”)
                    setFilter((f) => (f.student_user_id ? { ...f, student_user_id: null } : f));

                    // ak vymaže input úplne, je to “clear”
                    if (v.trim() === '') {
                      setFilter((f) => ({ ...f, student_user_id: null }));
                      setListStudentOptions([]);
                      setListStudentOpen(false);
                    }
                  }}
                />

                {listStudentOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border rounded-md shadow-md z-50 max-h-56 overflow-auto">
                    <div className="px-3 py-2 text-xs text-muted-foreground border-b">
                      {listStudentLoading ? 'Hľadám…' : 'Vyber študenta'}
                    </div>

                    {!listStudentLoading && listStudentOptions.length === 0 && listStudentQuery.trim().length >= 2 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">Žiadne výsledky.</div>
                    )}

                    {listStudentOptions.map((opt) => {
                      const clean = stripTrailingParens(opt.label);
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          className="w-full text-left px-3 py-2 text-sm hover:bg-green-50"
                          onClick={() => {
                            setFilter((f) => ({ ...f, student_user_id: opt.id }));
                            setListStudentQuery(clean); // ✅ bez (email)
                            setListStudentOpen(false);
                          }}
                        >
                          {clean}
                        </button>
                      );
                    })}

                    <div className="px-3 py-2 border-t flex items-center justify-between gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setListStudentOpen(false)}>
                        Zavrieť
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFilter((f) => ({ ...f, student_user_id: null }));
                          setListStudentQuery('');
                          setListStudentOptions([]);
                          setListStudentOpen(false);
                        }}
                      >
                        Zrušiť filter
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* ✅ Firma (presne) */}
              <div className="relative">
                <label className="text-sm text-muted-foreground">Firma</label>
                <Input
                  className="mt-1"
                  value={listCompanyQuery}
                  placeholder="Začni písať…"
                  onFocus={() => setListCompanyOpen(true)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setListCompanyQuery(v);
                    setListCompanyOpen(true);

                    setFilter((f) => (f.company_id ? { ...f, company_id: null } : f));

                    if (v.trim() === '') {
                      setFilter((f) => ({ ...f, company_id: null }));
                      setListCompanyOptions([]);
                      setListCompanyOpen(false);
                    }
                  }}
                />

                {listCompanyOpen && (
                  <div className="absolute left-0 right-0 mt-1 bg-white border rounded-md shadow-md z-50 max-h-56 overflow-auto">
                    <div className="px-3 py-2 text-xs text-muted-foreground border-b">
                      {listCompanyLoading ? 'Hľadám…' : 'Vyber firmu'}
                    </div>

                    {!listCompanyLoading && listCompanyOptions.length === 0 && listCompanyQuery.trim().length >= 2 && (
                      <div className="px-3 py-2 text-sm text-muted-foreground">Žiadne výsledky.</div>
                    )}

                    {listCompanyOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className="w-full text-left px-3 py-2 text-sm hover:bg-green-50"
                        onClick={() => {
                          setFilter((f) => ({ ...f, company_id: opt.id }));
                          setListCompanyQuery(opt.label);
                          setListCompanyOpen(false);
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}

                    <div className="px-3 py-2 border-t flex items-center justify-between gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setListCompanyOpen(false)}>
                        Zavrieť
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setFilter((f) => ({ ...f, company_id: null }));
                          setListCompanyQuery('');
                          setListCompanyOptions([]);
                          setListCompanyOpen(false);
                        }}
                      >
                        Zrušiť filter
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Odbor */}
              <div>
                <label className="text-sm text-muted-foreground">Odbor</label>
                <select
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={filter.program}
                  onChange={(e) => setFilter((f) => ({ ...f, program: e.target.value }))}
                >
                  <option value="all">Všetky</option>
                  {programs.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>

              {/* Rok */}
              <div>
                <label className="text-sm text-muted-foreground">Rok</label>
                <select
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={filter.year}
                  onChange={(e) =>
                    setFilter((f) => ({ ...f, year: e.target.value === 'all' ? 'all' : Number(e.target.value) }))
                  }
                >
                  <option value="all">Všetky</option>
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              {/* Stav */}
              <div>
                <label className="text-sm text-muted-foreground">Stav</label>
                <select
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={filter.status}
                  onChange={(e) => setFilter((f) => ({ ...f, status: e.target.value }))}
                >
                  <option value="all">Všetky</option>
                  {ALL_STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {loading && <p className="text-green-600">Načítavam…</p>}
            {error && <p className="text-red-600">{error}</p>}

            {!loading && !error && (
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
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.student}</TableCell>
                      <TableCell>{r.program ?? '—'}</TableCell>
                      <TableCell>
                        {r.firm}
                        {r.practice_type === 'employment' && (
                          <span className="ml-2 text-xs font-medium text-green-800 bg-green-100 border border-green-200 rounded px-2 py-0.5">
                            Zamestnanie
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{r.year}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_BADGE[r.status] || STATUS_BADGE.Vytvorená}>{r.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => openDetail(r.id)}>
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Žiadne záznamy.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}

            <Button variant="outline" size="sm" onClick={downloadCsv} disabled={downloadingCsv}>
              {downloadingCsv ? 'Sťahujem…' : 'Stiahnuť CSV'}
            </Button>
          </CardContent>
        </Card>

        {detailOpen && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
            <div className="w-full max-w-2xl bg-white rounded-xl shadow-xl p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-green-800">Detail praxe</h2>
                  {selected ? (
                    <p className="text-sm text-green-600">
                      {selected.student_firstname} {selected.student_lastname} – {selected.company_name}
                      {selected.practice_type === 'employment' ? (
                        <span className="ml-2 text-xs font-medium text-green-800 bg-green-100 border border-green-200 rounded px-2 py-0.5">
                          Zamestnanie
                        </span>
                      ) : null}
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

              <div className="mt-4 text-sm max-h-[70vh] overflow-y-auto pr-2">
                {detailLoading && <p className="text-green-600">Načítavam…</p>}
                {detailError && <p className="text-red-600">{detailError}</p>}
                {editError && <p className="text-red-600">{editError}</p>}

                {!detailLoading && !detailError && selected && (
                  <div className="space-y-4">
                    {/* ✅ DOKLADY – pre každý typ praxe */}
                    <div className="border-t pt-3 mt-2 space-y-2">
                      <p className="font-semibold text-green-700">
                        Doklady {selected.practice_type === 'employment' ? '(platené zamestnanie)' : '(zmluva / výkaz)'}
                      </p>

                      {selected.practice_type === 'employment' && docsCompliance && (
                        <p className={docsCompliance.ok ? 'text-green-700' : 'text-rose-700'}>
                          {docsCompliance.ok ? `✅ Splnené: ${docsCompliance.reason}` : `❌ Nesplnené: ${docsCompliance.reason}`}
                        </p>
                      )}

                      {docsLoading && <p className="text-green-600">Načítavam doklady…</p>}
                      {docsError && <p className="text-red-600">{docsError}</p>}

                      {docs.length === 0 && !docsLoading ? (
                        <p className="text-sm text-muted-foreground">Zatiaľ nie sú nahraté žiadne doklady.</p>
                      ) : (
                        <div className="space-y-2">
                          {docs.map((d) => (
                            <div key={d.id} className="flex items-center justify-between gap-2 border rounded-md px-3 py-2">
                              <div className="text-sm">
                                <div className="font-medium text-green-900">{d.name}</div>

                                {d.type === 'PRACTICE_REPORT' && (
                                  <div className="mt-1 text-xs">
                                    {d.company_review_status === 'approved' && (
                                      <span className="text-emerald-700">✅ Firma potvrdila výkaz</span>
                                    )}
                                    {d.company_review_status === 'rejected' && (
                                      <span className="text-rose-700">❌ Firma zamietla výkaz</span>
                                    )}
                                    {!d.company_review_status && (
                                      <span className="text-green-700">⏳ Čaká na potvrdenie firmy</span>
                                    )}

                                    {d.company_review_note && (
                                      <div className="mt-1 text-rose-700">
                                        Poznámka firmy: <span className="font-medium">{d.company_review_note}</span>
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="text-green-700">
                                  {d.type}
                                  {d.invoice_period ? ` • ${d.invoice_period}` : ''}
                                  {d.uploaded_at ? ` • ${d.uploaded_at}` : ''}
                                </div>
                              </div>

                              <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => downloadDoc(d.id)}>
                                  Stiahnuť
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => deleteDocForGarant(d.id, selected.id)}>
                                  Zmazať
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* ✅ NOVÉ: študent + firma (editable cez autocomplete) */}
                    <div className="border-t pt-3 mt-2 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Student */}
                        <div className="relative">
                          <p className="font-semibold text-green-700 mb-1">Študent</p>

                          {!isEditing || !edit ? (
                            <p className="text-green-900">
                              {selected.student_firstname} {selected.student_lastname}
                              {selected.student_email ? ` (${selected.student_email})` : ''}
                            </p>
                          ) : (
                            <>
                              <Input
                                value={studentQuery}
                                onChange={(e) => {
                                  setStudentQuery(e.target.value);
                                  setStudentOpen(true);
                                }}
                                onFocus={() => setStudentOpen(true)}
                                placeholder="Začni písať meno alebo email…"
                              />

                              {studentOpen && (
                                <div className="absolute left-0 right-0 mt-1 bg-white border rounded-md shadow-md z-50 max-h-56 overflow-auto">
                                  <div className="px-3 py-2 text-xs text-muted-foreground border-b">
                                    {studentLoading ? 'Hľadám…' : 'Vyber študenta'}
                                  </div>

                                  {!studentLoading && studentOptions.length === 0 && studentQuery.trim().length >= 2 && (
                                    <div className="px-3 py-2 text-sm text-muted-foreground">Žiadne výsledky.</div>
                                  )}

                                  {studentOptions.map((opt) => {
                                    const clean = stripTrailingParens(opt.label);
                                    return (
                                      <button
                                        key={opt.id}
                                        type="button"
                                        className="w-full text-left px-3 py-2 text-sm hover:bg-green-50"
                                        onClick={() => {
                                          if (!edit) return;
                                          setEdit({ ...edit, student_user_id: opt.id });
                                          setStudentQuery(clean); // ✅ bez (email)
                                          setStudentOpen(false);
                                        }}
                                      >
                                        {clean}
                                      </button>
                                    );
                                  })}

                                  <div className="px-3 py-2 border-t">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setStudentOpen(false)}>
                                      Zavrieť
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>

                        {/* Company */}
                        <div className="relative">
                          <p className="font-semibold text-green-700 mb-1">Firma</p>

                          {!isEditing || !edit ? (
                            <p className="text-green-900">{selected.company_name}</p>
                          ) : (
                            <>
                              <Input
                                value={companyQuery}
                                onChange={(e) => {
                                  setCompanyQuery(e.target.value);
                                  setCompanyOpen(true);
                                }}
                                onFocus={() => setCompanyOpen(true)}
                                placeholder="Začni písať názov firmy…"
                              />

                              {companyOpen && (
                                <div className="absolute left-0 right-0 mt-1 bg-white border rounded-md shadow-md z-50 max-h-56 overflow-auto">
                                  <div className="px-3 py-2 text-xs text-muted-foreground border-b">
                                    {companyLoading ? 'Hľadám…' : 'Vyber firmu'}
                                  </div>

                                  {!companyLoading && companyOptions.length === 0 && companyQuery.trim().length >= 2 && (
                                    <div className="px-3 py-2 text-sm text-muted-foreground">Žiadne výsledky.</div>
                                  )}

                                  {companyOptions.map((opt) => (
                                    <button
                                      key={opt.id}
                                      type="button"
                                      className="w-full text-left px-3 py-2 text-sm hover:bg-green-50"
                                      onClick={() => {
                                        if (!edit) return;
                                        setEdit({ ...edit, company_id: opt.id });
                                        setCompanyQuery(opt.label);
                                        setCompanyOpen(false);
                                      }}
                                    >
                                      {opt.label}
                                    </button>
                                  ))}

                                  <div className="px-3 py-2 border-t">
                                    <Button type="button" variant="outline" size="sm" onClick={() => setCompanyOpen(false)}>
                                      Zavrieť
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      </div>

                      {isEditing && edit && (
                        <p className="text-xs text-muted-foreground">
                          Pozn.: Pre uloženie sa posiela <code>student_user_id</code> a <code>company_id</code> podľa zvoleného výsledku.
                        </p>
                      )}
                    </div>

                    {/* ... zvyšok detailu nechávam nezmenený ... */}

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <p className="font-semibold text-green-700">Začiatok</p>
                        {!isEditing || !edit ? (
                          <p className="text-green-900">{selected.start_date}</p>
                        ) : (
                          <Input type="date" value={edit.start_date} onChange={(e) => setEdit({ ...edit, start_date: e.target.value })} />
                        )}
                      </div>

                      <div>
                        <p className="font-semibold text-green-700">Koniec</p>
                        {!isEditing || !edit ? (
                          <p className="text-green-900">{selected.end_date}</p>
                        ) : (
                          <Input type="date" value={edit.end_date} onChange={(e) => setEdit({ ...edit, end_date: e.target.value })} />
                        )}
                      </div>

                      <div>
                        <p className="font-semibold text-green-700">Rok / Sem.</p>
                        {!isEditing || !edit ? (
                          <p className="text-green-900">
                            {selected.year} / {selected.semester}
                          </p>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            <Input type="number" value={edit.year} onChange={(e) => setEdit({ ...edit, year: Number(e.target.value) })} />
                            <select
                              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                              value={edit.semester}
                              onChange={(e) => setEdit({ ...edit, semester: e.target.value as '1' | '2' })}
                            >
                              <option value="1">1</option>
                              <option value="2">2</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="font-semibold text-green-700">Odpracované hodiny</p>
                        {!isEditing || !edit ? (
                          <p className="text-green-900">{selected.worked_hours ?? '—'}</p>
                        ) : (
                          <Input
                            type="number"
                            value={edit.worked_hours ?? ''}
                            onChange={(e) =>
                              setEdit({
                                ...edit,
                                worked_hours: e.target.value === '' ? null : Number(e.target.value),
                              })
                            }
                          />
                        )}
                      </div>

                      <div>
                        <p className="font-semibold text-green-700">Stav</p>
                        <Badge className={STATUS_BADGE[selected.status] || STATUS_BADGE.Vytvorená}>{selected.status}</Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isEditing ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setIsEditing(true);
                            setEdit(selected ? detailToEdit(selected) : null);
                            setEditError(null);

                            setStudentOpen(false);
                            setCompanyOpen(false);
                          }}
                        >
                          Upraviť
                        </Button>
                      ) : (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsEditing(false);
                              setEdit(selected ? detailToEdit(selected) : null);
                              setEditError(null);

                              const studentLabel = `${selected.student_firstname ?? ''} ${selected.student_lastname ?? ''}`.trim();
                              setStudentQuery(studentLabel); // ✅ bez (email)
                              setCompanyQuery(selected.company_name ?? '');

                              setStudentOpen(false);
                              setCompanyOpen(false);
                            }}
                          >
                            Zrušiť
                          </Button>
                          <Button type="button" size="sm" onClick={saveEdit} disabled={savingEdit || !edit}>
                            {savingEdit ? 'Ukladám…' : 'Uložiť'}
                          </Button>
                        </>
                      )}
                    </div>

                    {(canApprove || canReject) && (
                      <div className="border-t pt-3 mt-2 flex flex-wrap gap-2 justify-end">
                        {canApprove && (
                          <Button size="sm" className="bg-green-700 hover:bg-green-800 text-white" onClick={() => approve(selected.id)}>
                            Schváliť
                          </Button>
                        )}

                        {canReject && (
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

                    {canGrade && (
                      <div className="border-t pt-3 mt-2 flex flex-wrap gap-2 justify-end">
                        {selected.status !== 'Obhájená' && (
                          <Button size="sm" className="bg-green-700 hover:bg-green-800 text-white" onClick={() => grade(selected.id, 'Obhájená')}>
                            Obhájená
                          </Button>
                        )}

                        {selected.status !== 'Neobhájená' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            className="bg-green-100 text-green-800 hover:bg-green-200"
                            onClick={() => grade(selected.id, 'Neobhájená')}
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
      </div>
    </AppLayoutSpa>
  );
}
