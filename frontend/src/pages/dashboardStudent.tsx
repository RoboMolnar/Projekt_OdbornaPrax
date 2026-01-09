import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import AppLayoutSpa from '@/ui/AppLayoutSpa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { api } from '@/shared/apiClient';

type Practice = {
  id: number;
  firm: string;
  year: number;
  status: string;
  practice_type?: 'standard' | 'employment';
};

type PracticeDetail = {
  practice_type: 'standard' | 'employment';
  id: number;
  company_name: string | null;
  street: string | null;
  city: string | null;
  zip: string | null;
  country: string | null;
  start_date: string;
  end_date: string;
  year: number;
  semester: number | string;
  worked_hours: number | null;
  status: string | null;
};

type DocsCompliance = { required: boolean; ok: boolean; reason: string | null };

type StandardCompliance = {
  contract?: { required: boolean; ok: boolean; reason: string | null };
  report?: { required: boolean; ok: boolean; reason: string | null };
  state?: string | null;
} | null;

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

type CompanySearchItem = {
  company_id: number;
  company_name: string;
  street?: string | null;
  city?: string | null;
  zip?: string | null;
  country?: string | null;
};

const breadcrumbs = [{ title: 'Dashboard študenta', href: '/dashboard-student' }];

// rovnaké farbičky ako na garantovi (môžeš skopírovať aj do ďalších dashboardov)
const STATUS_BADGE: Record<string, string> = {
  Vytvorená: 'border-green-300 text-green-800 bg-green-50',
  Potvrdená: 'border-green-500 text-green-800 bg-green-100',
  Zamietnutá: 'border-red-300 text-red-700 bg-red-50',
  Schválená: 'border-emerald-300 text-emerald-700 bg-emerald-50',
  Neschválená: 'border-red-300 text-red-700 bg-red-50',
  Obhájená: 'border-emerald-300 text-emerald-700 bg-emerald-50',
  Neobhájená: 'border-red-300 text-red-700 bg-red-50',
};

export default function DashboardStudent() {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);

  // ✅ FORM pre "Nová prax" - už len výber firmy + dátumy/rok/semester
  const [form, setForm] = useState({
    practice_type: 'standard' as 'standard' | 'employment',

    // ✅ firma sa vyberá zo zoznamu
    company_query: '',
    company_id: null as number | null,

    start_date: '',
    end_date: '',
    year: new Date().getFullYear().toString(),
    semester: '1',
    worked_hours: '',
  });

  // ✅ fulltext vyhľadávanie firiem
  const [companyResults, setCompanyResults] = useState<CompanySearchItem[]>([]);
  const [companySearchLoading, setCompanySearchLoading] = useState(false);
  const [companyDropdownOpen, setCompanyDropdownOpen] = useState(false);

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedPractice, setSelectedPractice] = useState<PracticeDetail | null>(null);

  // EDIT MODE (študent môže meniť len dátumy/rok/semester/hodiny)
  const [editing, setEditing] = useState(false);
  const [editBusy, setEditBusy] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    start_date: '',
    end_date: '',
    year: '',
    semester: '1',
    worked_hours: '',
  });

  const [deleteBusy, setDeleteBusy] = useState(false);

  // Doklady (employment aj standard)
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [docsLoading, setDocsLoading] = useState(false);
  const [docsError, setDocsError] = useState<string | null>(null);

  // employment compliance (existujúce)
  const [docsCompliance, setDocsCompliance] = useState<DocsCompliance | null>(null);

  // standard compliance (nové)
  const [standardCompliance, setStandardCompliance] = useState<StandardCompliance>(null);

  // Employment upload
  const [uploadType, setUploadType] = useState<'EMPLOYMENT_CONTRACT' | 'EMPLOYMENT_INVOICE' | 'PRACTICE_REPORT'>(
    'EMPLOYMENT_CONTRACT'
  );

  const [invoicePeriod, setInvoicePeriod] = useState(''); // YYYY-MM
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadBusy, setUploadBusy] = useState(false);

  // Standard upload
  const [contractFile, setContractFile] = useState<File | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [contractBusy, setContractBusy] = useState(false);
  const [reportBusy, setReportBusy] = useState(false);

  useEffect(() => {
    document.title = 'Dashboard študenta';
    loadPractices();
  }, []);

  async function loadPractices() {
    try {
      setLoading(true);
      const res = await api.get<Practice[]>('/api/student/internships');
      setPractices(res.data);
      setListError(null);
    } catch (e) {
      setListError('Nepodarilo sa načítať tvoje praxe.');
    } finally {
      setLoading(false);
    }
  }

  // ✅ debounce search pre firmy (fulltext)
  useEffect(() => {
    if (!companyDropdownOpen) return;

    const q = (form.company_query || '').trim();
    const t = setTimeout(async () => {
      if (q.length < 2) {
        setCompanyResults([]);
        return;
      }

      setCompanySearchLoading(true);
      try {
        const res = await api.get(`/api/companies/search?q=${encodeURIComponent(q)}`);

        // server môže vrátiť {data:[...]} alebo priamo [...]
        const payload = res.data as any;
        const items: CompanySearchItem[] = Array.isArray(payload)
          ? payload
          : Array.isArray(payload?.data)
          ? payload.data
          : [];

        setCompanyResults(items);
      } catch {
        setCompanyResults([]);
      } finally {
        setCompanySearchLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [form.company_query, companyDropdownOpen]);

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  function handleCompanyQueryChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setForm((prev) => ({
      ...prev,
      company_query: value,
      company_id: null, // ✅ ak začne písať, výber sa zruší
    }));
    setCompanyDropdownOpen(true);
  }

  function selectCompany(c: CompanySearchItem) {
    setForm((prev) => ({
      ...prev,
      company_query: c.company_name,
      company_id: c.company_id,
    }));
    setCompanyDropdownOpen(false);
    setCompanyResults([]);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    // ✅ firma je povinná a musí byť vybratá zo zoznamu
    if (!form.company_id) {
      setFormError('Firma je povinná – musíš ju vybrať zo zoznamu.');
      return;
    }

    try {
      await api.post('/api/student/internships', {
        practice_type: form.practice_type,
        company_id: form.company_id,
        start_date: form.start_date,
        end_date: form.end_date,
        year: Number(form.year),
        semester: form.semester,
        worked_hours: form.worked_hours ? Number(form.worked_hours) : undefined,
      });

      setForm((prev) => ({
        ...prev,
        practice_type: 'standard',
        company_query: '',
        company_id: null,
        start_date: '',
        end_date: '',
        worked_hours: '',
      }));

      await loadPractices();
      setShowForm(false);
    } catch (e: any) {
      const msg = e?.response?.data?.message;

      const errors = e?.response?.data?.errors;
      const firstError =
        errors && typeof errors === 'object'
          ? (Object.values(errors).flat() as any[])[0]
          : null;

      setFormError(firstError || msg || 'Prax sa nepodarilo uložiť. Skontroluj údaje alebo skús neskôr.');
    }
  }

  async function loadDocs(internshipId: number) {
    setDocsLoading(true);
    setDocsError(null);
    try {
      const res = await api.get(`/api/student/internships/${internshipId}/documents`);
      setDocs((res.data?.documents || []) as DocRow[]);
      setDocsCompliance((res.data?.employment_compliance || null) as DocsCompliance | null);
      setStandardCompliance((res.data?.standard_compliance || null) as StandardCompliance);
    } catch (e: any) {
      setDocsError(e?.response?.data?.message || 'Nepodarilo sa načítať doklady.');
    } finally {
      setDocsLoading(false);
    }
  }

  async function uploadDoc(internshipId: number) {
    if (!uploadFile) return;

    setUploadBusy(true);
    try {
      const fd = new FormData();
      fd.append('type', uploadType);
      if (uploadType === 'EMPLOYMENT_INVOICE') fd.append('invoice_period', invoicePeriod);
      fd.append('file', uploadFile);

      await api.post(`/api/student/internships/${internshipId}/documents`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setUploadFile(null);
      setInvoicePeriod('');
      await loadDocs(internshipId);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Upload zlyhal.');
    } finally {
      setUploadBusy(false);
    }
  }

  async function uploadDocTyped(internshipId: number, type: string, file: File, invoice?: string) {
    const fd = new FormData();
    fd.append('type', type);
    if (invoice) fd.append('invoice_period', invoice);
    fd.append('file', file);

    await api.post(`/api/student/internships/${internshipId}/documents`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }

  async function deleteDoc(documentId: number, internshipId: number) {
    const ok = window.confirm('Naozaj chceš zmazať tento doklad?');
    if (!ok) return;

    try {
      await api.delete(`/api/student/documents/${documentId}`);
      await loadDocs(internshipId);
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

  async function downloadAgreement(internshipId: number) {
  try {
    const res = await api.get(`/api/internships/${internshipId}/agreement`, {
      responseType: 'blob',
    });

    let filename = `Dohoda_o_odbornej_praxi.pdf`;
    const dispo = res.headers?.['content-disposition'] || res.headers?.['Content-Disposition'];
    if (dispo) {
      const match = /filename\*?=(?:UTF-8''|")?([^";\n]+)"?/i.exec(dispo);
      if (match?.[1]) filename = decodeURIComponent(match[1].replace(/"/g, '').trim());
    }

    const contentType = res.headers?.['content-type'] || 'application/pdf';
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
    // keď príde JSON chyba ako blob, vytiahni message
    const data = e?.response?.data;
    if (data instanceof Blob) {
      const text = await data.text().catch(() => '');
      try {
        const j = JSON.parse(text);
        alert(j?.message || 'Nepodarilo sa stiahnuť dohodu.');
        return;
      } catch {}
    }
    alert(e?.response?.data?.message || 'Nepodarilo sa stiahnuť dohodu.');
  }
}


  async function openDetail(id: number) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setSelectedPractice(null);

    // reset edit state
    setEditing(false);
    setEditError(null);
    setEditBusy(false);

    // reset docs state
    setDocs([]);
    setDocsCompliance(null);
    setStandardCompliance(null);
    setDocsError(null);

    setUploadType('EMPLOYMENT_CONTRACT');
    setInvoicePeriod('');
    setUploadFile(null);

    setContractFile(null);
    setReportFile(null);
    setContractBusy(false);
    setReportBusy(false);

    try {
      const res = await api.get<PracticeDetail>(`/api/student/internships/${id}`);
      setSelectedPractice(res.data);

      // predvyplň edit form (len povolené polia)
      setEditForm({
        start_date: res.data.start_date ?? '',
        end_date: res.data.end_date ?? '',
        year: String(res.data.year ?? ''),
        semester: String(res.data.semester ?? '1'),
        worked_hours: res.data.worked_hours == null ? '' : String(res.data.worked_hours),
      });

      await loadDocs(id);
    } catch (e) {
      setDetailError('Nepodarilo sa načítať detaily praxe.');
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setDetailOpen(false);
    setEditing(false);
    setEditError(null);
  }

  const canEditOrDelete = useMemo(() => {
    return !!selectedPractice;
  }, [selectedPractice]);

  function onEditChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  }

  async function saveEdit() {
    if (!selectedPractice) return;

    setEditBusy(true);
    setEditError(null);

    try {
      await api.patch(`/api/student/internships/${selectedPractice.id}`, {
        start_date: editForm.start_date,
        end_date: editForm.end_date,
        year: editForm.year ? Number(editForm.year) : undefined,
        semester: editForm.semester,
        worked_hours: editForm.worked_hours === '' ? null : Number(editForm.worked_hours),
      });

      await openDetail(selectedPractice.id);
      await loadPractices();
      setEditing(false);
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setEditError(msg || 'Nepodarilo sa uložiť zmeny. Skontroluj údaje alebo skús neskôr.');
    } finally {
      setEditBusy(false);
    }
  }

  async function deletePractice() {
    if (!selectedPractice) return;

    const ok = window.confirm('Naozaj chceš zmazať túto prax? Táto akcia sa nedá vrátiť späť.');
    if (!ok) return;

    setDeleteBusy(true);
    setEditError(null);

    try {
      await api.delete(`/api/student/internships/${selectedPractice.id}`);
      closeDetail();
      await loadPractices();
    } catch (e: any) {
      const msg = e?.response?.data?.message;
      setEditError(msg || 'Nepodarilo sa zmazať prax. Skús neskôr.');
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <AppLayoutSpa breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        <Card className="bg-white/90 border border-green-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-green-700">Moje praxe</CardTitle>
              <p className="mt-1 text-sm text-green-700">Tu vidíš prehľad svojich odborných praxí a môžeš pridať novú.</p>
            </div>
            <Button
              type="button"
              onClick={() => setShowForm((prev) => !prev)}
              className="bg-green-700 text-white shadow-sm hover:bg-green-800 hover:shadow-md transition-all duration-200"
            >
              Nová prax
            </Button>
          </CardHeader>

          <CardContent>
            {showForm && (
              <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
                <h2 className="mb-3 text-sm font-semibold text-green-800">Pridať novú prax</h2>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-green-800">Typ praxe *</label>
                    <select
                      name="practice_type"
                      value={form.practice_type}
                      onChange={handleChange}
                      className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="standard">Odborná prax (štandard)</option>
                      <option value="employment">Platené zamestnanie (zmluva alebo faktúry)</option>
                    </select>
                    {form.practice_type === 'employment' && (
                      <p className="mt-1 text-xs text-green-700">
                        Pri platenom zamestnaní budeš neskôr v detaile nahrávať zmluvu alebo 3 po sebe idúce faktúry (s mesiacom).
                      </p>
                    )}
                  </div>

                  {/* ✅ Firma - fulltext vyhľadávanie + povinný výber */}
                  <div className="relative">
                    <label className="block text-sm font-medium mb-1 text-green-800">
                      Firma (vyhľadaj a vyber zo zoznamu) <span className="text-red-600">*</span>
                    </label>
                    <Input
                      name="company_query"
                      value={form.company_query}
                      onChange={handleCompanyQueryChange}
                      onFocus={() => setCompanyDropdownOpen(true)}
                      placeholder="Začni písať názov firmy..."
                      required
                    />

                    {companyDropdownOpen && (
                      <div className="absolute z-20 mt-2 w-full max-h-56 overflow-auto rounded-md border border-green-200 bg-white p-2 shadow">
                        {companySearchLoading ? (
                          <div className="text-sm text-slate-600">Načítavam…</div>
                        ) : companyResults.length === 0 ? (
                          <div className="text-sm text-rose-600">
                            Firma sa nenašla – prax nie je možné pridať.
                          </div>
                        ) : (
                          companyResults.map((c) => (
                            <button
                              key={c.company_id}
                              type="button"
                              className="block w-full rounded-md px-2 py-1 text-left text-sm hover:bg-green-50"
                              onClick={() => selectCompany(c)}
                            >
                              <div className="font-medium text-green-900">{c.company_name}</div>
                              <div className="text-xs text-green-700">
                                {[c.street, c.city, c.zip, c.country].filter(Boolean).join(', ')}
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}

                    <p className="mt-1 text-xs text-green-700">
                      Vybraná firma: <b>{form.company_id ? form.company_query : '—'}</b>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-green-800">Dátum začiatku *</label>
                      <Input type="date" name="start_date" value={form.start_date} onChange={handleChange} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-green-800">Dátum konca *</label>
                      <Input type="date" name="end_date" value={form.end_date} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-green-800">Rok *</label>
                      <Input type="number" name="year" value={form.year} onChange={handleChange} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-green-800">Semester *</label>
                      <select
                        name="semester"
                        value={form.semester}
                        onChange={handleChange}
                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-green-800">Odpracované hodiny</label>
                      <Input type="number" name="worked_hours" value={form.worked_hours} onChange={handleChange} min={0} />
                    </div>
                  </div>

                  {formError && <p className="text-sm text-red-600">{formError}</p>}

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowForm(false);
                        setCompanyDropdownOpen(false);
                        setCompanyResults([]);
                        setFormError(null);
                      }}
                    >
                      Zrušiť
                    </Button>
                    <Button type="submit">Uložiť prax</Button>
                  </div>
                </form>
              </div>
            )}

            {listError && <p className="mb-3 text-sm text-red-600">{listError}</p>}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Firma</TableHead>
                  <TableHead>Rok</TableHead>
                  <TableHead>Stav</TableHead>
                  <TableHead>Akcie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={4}>Načítavam…</TableCell>
                  </TableRow>
                )}

                {!loading && practices.length === 0 && !listError && (
                  <TableRow>
                    <TableCell colSpan={4}>Zatiaľ nemáš žiadnu prax.</TableCell>
                  </TableRow>
                )}

                {!loading &&
                  practices.map((p) => (
                    <TableRow key={p.id} className="hover:bg-green-50">
                      <TableCell className="text-green-900">
                        {p.firm}
                        {p.practice_type === 'employment' && (
                          <span className="ml-2 text-xs font-medium text-green-800 bg-green-100 border border-green-200 rounded px-2 py-0.5">
                            Zamestnanie
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{p.year}</TableCell>
                      <TableCell>
                        <Badge className={STATUS_BADGE[p.status] || STATUS_BADGE.Vytvorená}>{p.status}</Badge>
                      </TableCell>
                      <TableCell className="space-x-2">
                        <Button variant="outline" size="sm" onClick={() => openDetail(p.id)}>
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* MODAL: DETAIL + EDIT */}
      {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-lg border border-green-200 p-6 max-h-[85vh] flex flex-col">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-green-900">{editing ? 'Upraviť prax' : 'Detail praxe'}</h2>
                <p className="text-sm text-green-700">
                  {editing ? 'Upraviteľné sú údaje okrem firmy, typu praxe a stavu.' : 'Podrobné informácie o tvojej odbornej praxi.'}
                </p>
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

            <div className="mt-4 text-sm overflow-y-auto pr-1 flex-1">
              {detailLoading && <p className="text-green-700">Načítavam…</p>}
              {detailError && <p className="text-red-600">{detailError}</p>}

              {!detailLoading && !detailError && selectedPractice && !editing && (
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-green-800">Typ praxe</p>
                    <p className="text-green-900">
                      {selectedPractice.practice_type === 'employment'
                        ? 'Platené zamestnanie (zmluva alebo faktúry)'
                        : 'Odborná prax (štandard)'}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-green-800">Firma</p>
                    <p className="text-green-900">{selectedPractice.company_name || '—'}</p>
                  </div>

                  <div>
                    <p className="font-semibold text-green-800">Adresa</p>
                    <p className="text-green-900">{[selectedPractice.street, selectedPractice.city].filter(Boolean).join(', ') || '—'}</p>
                    <p className="text-green-900">{[selectedPractice.zip, selectedPractice.country].filter(Boolean).join(' ') || ''}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="font-semibold text-green-800">Dátum začiatku</p>
                      <p className="text-green-900">{selectedPractice.start_date}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-green-800">Dátum konca</p>
                      <p className="text-green-900">{selectedPractice.end_date}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <p className="font-semibold text-green-800">Rok</p>
                      <p className="text-green-900">{selectedPractice.year}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-green-800">Semester</p>
                      <p className="text-green-900">{selectedPractice.semester}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-green-800">Odpracované hodiny</p>
                      <p className="text-green-900">{selectedPractice.worked_hours ?? '—'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-green-800">Stav</p>
                    <Badge className={STATUS_BADGE[selectedPractice.status ?? 'Vytvorená'] || STATUS_BADGE.Vytvorená}>
                      {selectedPractice.status ?? '—'}
                    </Badge>
                  </div>

                  {/* DOKLADOVANIE: EMPLOYMENT */}
                  {selectedPractice.practice_type === 'employment' && (
                    <div className="border-t pt-3 mt-3 space-y-2">
                      <p className="font-semibold text-green-800">Dokladovanie (platené zamestnanie)</p>

                      {docsCompliance && (
                        <p className={docsCompliance.ok ? 'text-green-700' : 'text-rose-700'}>
                          {docsCompliance.ok ? `✅ Splnené: ${docsCompliance.reason}` : `❌ Nesplnené: ${docsCompliance.reason}`}
                        </p>
                      )}

                      {docsLoading && <p className="text-green-700">Načítavam doklady…</p>}
                      {docsError && <p className="text-red-600">{docsError}</p>}

                      <div className="rounded-md border p-3 space-y-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <div>
                            <label className="text-sm text-green-800">Typ dokladu</label>
                            <select
                              value={uploadType}
                              onChange={(e) => setUploadType(e.target.value as any)}
                              className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            >
                              <option value="EMPLOYMENT_CONTRACT">Pracovná zmluva</option>
                              <option value="EMPLOYMENT_INVOICE">Faktúra</option>
                              <option value="PRACTICE_REPORT">Výkaz</option>
                            </select>
                          </div>

                          {uploadType === 'EMPLOYMENT_INVOICE' && (
                            <div>
                              <label className="text-sm text-green-800">Obdobie faktúry (YYYY-MM)</label>
                              <Input type="month" value={invoicePeriod} onChange={(e) => setInvoicePeriod(e.target.value)} className="mt-1" />
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col md:flex-row gap-2 md:items-center">
                          <Input type="file" onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)} />
                          <Button
                            type="button"
                            onClick={() => uploadDoc(selectedPractice.id)}
                            disabled={uploadBusy || !uploadFile || (uploadType === 'EMPLOYMENT_INVOICE' && !invoicePeriod)}
                          >
                            {uploadBusy ? 'Nahrávam…' : 'Nahrať'}
                          </Button>
                        </div>

                        <p className="text-xs text-green-700">Nahraj buď 1× zmluvu, alebo 3 po sebe idúce faktúry (s mesiacmi).</p>
                      </div>

                      <div className="space-y-1">
                        {docs.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Zatiaľ nie sú nahraté žiadne doklady.</p>
                        ) : (
                          docs.map((d) => (
                            <div key={d.id} className="flex items-center justify-between gap-2 border rounded-md px-3 py-2">
                              <div className="text-sm">
                                <div className="font-medium text-green-900">{d.name}</div>

                                {d.type === 'PRACTICE_REPORT' && (
                                  <div className="mt-1 text-xs">
                                    {d.company_review_status === 'approved' && <span className="text-emerald-700">✅ Firma potvrdila výkaz</span>}
                                    {d.company_review_status === 'rejected' && <span className="text-rose-700">❌ Firma zamietla výkaz</span>}
                                    {!d.company_review_status && <span className="text-green-700">⏳ Čaká na potvrdenie firmy</span>}

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
                                <Button variant="outline" size="sm" onClick={() => deleteDoc(d.id, selectedPractice.id)}>
                                  Zmazať
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* DOKLADOVANIE: STANDARD (Zmluva + Výkaz) */}
                  {selectedPractice.practice_type === 'standard' && (
                    <div className="border-t pt-3 mt-3 space-y-2">
                      <p className="font-semibold text-green-800">Dokladovanie (odborná prax)</p>

                      {standardCompliance?.contract && (
                        <p className={standardCompliance.contract.ok ? 'text-green-700' : 'text-rose-700'}>
                          {standardCompliance.contract.ok ? `✅ Zmluva: ${standardCompliance.contract.reason ?? 'OK'}` : `❌ Zmluva: ${standardCompliance.contract.reason ?? 'Chýba'}`}
                        </p>
                      )}

                      {standardCompliance?.report && (
                        <p
                          className={
                            standardCompliance.report.required
                              ? standardCompliance.report.ok
                                ? 'text-green-700'
                                : 'text-rose-700'
                              : 'text-green-700'
                          }
                        >
                          {standardCompliance.report.required
                            ? standardCompliance.report.ok
                              ? `✅ Výkaz: ${standardCompliance.report.reason ?? 'OK'}`
                              : `❌ Výkaz: ${standardCompliance.report.reason ?? 'Chýba'}`
                            : `ℹ️ Výkaz: ${standardCompliance.report.reason ?? 'Neskôr'}`}
                        </p>
                      )}

                      {docsLoading && <p className="text-green-700">Načítavam doklady…</p>}
                      {docsError && <p className="text-red-600">{docsError}</p>}

                      {/* ZMLUVA */}
                      <div className="rounded-md border p-3 space-y-2">
                        <p className="text-sm font-medium text-green-800">Zmluva</p>
                        <div className="flex flex-col md:flex-row gap-2 md:items-center">
                          <Input type="file" onChange={(e) => setContractFile(e.target.files?.[0] ?? null)} />
                          <Button
                            type="button"
                            disabled={!contractFile || contractBusy}
                            onClick={async () => {
                              if (!contractFile) return;
                              try {
                                setContractBusy(true);
                                await uploadDocTyped(selectedPractice.id, 'PRACTICE_CONTRACT', contractFile);
                                setContractFile(null);
                                await loadDocs(selectedPractice.id);
                              } catch (e: any) {
                                alert(e?.response?.data?.message || 'Upload zlyhal.');
                              } finally {
                                setContractBusy(false);
                              }
                            }}
                          >
                            {contractBusy ? 'Nahrávam…' : 'Nahrať zmluvu'}
                          </Button>
                        </div>
                        <p className="text-xs text-green-700">Zmluvu nahraj čo najskôr po vytvorení praxe.</p>
                      </div>

                      {/* VÝKAZ */}
                      {(() => {
                        const reportAllowed = selectedPractice.status === 'Obhájená' || selectedPractice.status === 'Neobhájená';
                        return (
                          <div className="rounded-md border p-3 space-y-2">
                            <p className="text-sm font-medium text-green-800">Výkaz</p>
                            <div className="flex flex-col md:flex-row gap-2 md:items-center">
                              <Input type="file" onChange={(e) => setReportFile(e.target.files?.[0] ?? null)} />
                              <Button
                                type="button"
                                disabled={!reportAllowed || !reportFile || reportBusy}
                                onClick={async () => {
                                  if (!reportFile) return;
                                  try {
                                    setReportBusy(true);
                                    await uploadDocTyped(selectedPractice.id, 'PRACTICE_REPORT', reportFile);
                                    setReportFile(null);
                                    await loadDocs(selectedPractice.id);
                                  } catch (e: any) {
                                    alert(e?.response?.data?.message || 'Upload zlyhal.');
                                  } finally {
                                    setReportBusy(false);
                                  }
                                }}
                              >
                                {reportBusy ? 'Nahrávam…' : 'Nahrať výkaz'}
                              </Button>
                            </div>
                            {!reportAllowed && <p className="text-xs text-green-700">Výkaz sa dá nahrať až na konci praxe (po obhajobe).</p>}
                          </div>
                        );
                      })()}

                      {/* ZOZNAM DOKLADOV */}
                      <div className="space-y-1">
                        {docs.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Zatiaľ nie sú nahraté žiadne doklady.</p>
                        ) : (
                          docs.map((d) => (
                            <div key={d.id} className="flex items-center justify-between gap-2 border rounded-md px-3 py-2">
                              <div className="text-sm">
                                <div className="font-medium text-green-900">{d.name}</div>

                                {d.type === 'PRACTICE_REPORT' && (
                                  <div className="mt-1 text-xs">
                                    {d.company_review_status === 'approved' && <span className="text-emerald-700">✅ Firma potvrdila výkaz</span>}
                                    {d.company_review_status === 'rejected' && <span className="text-rose-700">❌ Firma zamietla výkaz</span>}
                                    {!d.company_review_status && <span className="text-green-700">⏳ Čaká na potvrdenie firmy</span>}

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
                                <Button variant="outline" size="sm" onClick={() => deleteDoc(d.id, selectedPractice.id)}>
                                  Zmazať
                                </Button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* EDIT UI (bez adresy) */}
              {!detailLoading && !detailError && selectedPractice && editing && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-green-800">Dátum začiatku *</label>
                      <Input type="date" name="start_date" value={editForm.start_date} onChange={onEditChange} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-green-800">Dátum konca *</label>
                      <Input type="date" name="end_date" value={editForm.end_date} onChange={onEditChange} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-green-800">Rok *</label>
                      <Input type="number" name="year" value={editForm.year} onChange={onEditChange} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-green-800">Semester *</label>
                      <select
                        name="semester"
                        value={editForm.semester}
                        onChange={onEditChange}
                        className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                      >
                        <option value="1">1</option>
                        <option value="2">2</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-green-800">Odpracované hodiny</label>
                      <Input type="number" name="worked_hours" value={editForm.worked_hours} onChange={onEditChange} min={0} />
                    </div>
                  </div>

                  {editError && <p className="text-sm text-red-600">{editError}</p>}
                </div>
              )}
            </div>

                        <div className="mt-4 pt-4 border-t flex items-center justify-between gap-2 bg-white sticky bottom-0">
              <div>
                {!detailLoading && !detailError && selectedPractice && !editing && canEditOrDelete && (
                  <Button variant="destructive" onClick={deletePractice} disabled={deleteBusy}>
                    {deleteBusy ? 'Mažem…' : 'Zmazať'}
                  </Button>
                )}
              </div>

              <div className="flex justify-end gap-2">
                {/* ✅ NOVÉ: tlačidlo na stiahnutie dohody - len pre STANDARD */}
                {!detailLoading &&
                  !detailError &&
                  selectedPractice &&
                  selectedPractice.practice_type === 'standard' && (
                    <Button
                      variant="outline"
                      onClick={() => downloadAgreement(selectedPractice.id)}
                    >
                      Stiahnuť dohodu (PDF)
                    </Button>
                  )}

                {!detailLoading && !detailError && selectedPractice && !editing && canEditOrDelete && (
                  <Button onClick={() => setEditing(true)} className="bg-green-700 text-white hover:bg-green-800">
                    Upraviť
                  </Button>
                )}

                {!detailLoading && !detailError && selectedPractice && editing && (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditForm({
                          start_date: selectedPractice.start_date ?? '',
                          end_date: selectedPractice.end_date ?? '',
                          year: String(selectedPractice.year ?? ''),
                          semester: String(selectedPractice.semester ?? '1'),
                          worked_hours: selectedPractice.worked_hours == null ? '' : String(selectedPractice.worked_hours),
                        });
                        setEditError(null);
                        setEditing(false);
                      }}
                      disabled={editBusy}
                    >
                      Zrušiť
                    </Button>
                    <Button onClick={saveEdit} disabled={editBusy}>
                      {editBusy ? 'Ukladám…' : 'Uložiť'}
                    </Button>
                  </>
                )}

                <Button variant="outline" onClick={closeDetail}>
                  Zavrieť
                </Button>
              </div>
            </div>


          </div>
        </div>
      )}
    </AppLayoutSpa>
  );
}