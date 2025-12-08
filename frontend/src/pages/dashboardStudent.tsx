import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
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
};

type PracticeDetail = {
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

const breadcrumbs = [{ title: 'Dashboard študenta', href: '/dashboard-student' }];

export default function DashboardStudent() {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [listError, setListError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);

  const [form, setForm] = useState({
    company_name: '',
    street: '',
    city: '',
    zip: '',
    country: 'Slovensko',
    start_date: '',
    end_date: '',
    year: new Date().getFullYear().toString(),
    semester: '1',
    worked_hours: '',
  });

  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [selectedPractice, setSelectedPractice] = useState<PracticeDetail | null>(null);

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

  function handleChange(e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);

    try {
      await api.post('/api/student/internships', {
        company_name: form.company_name,
        street: form.street || null,
        city: form.city,
        zip: form.zip || null,
        country: form.country || null,
        start_date: form.start_date,
        end_date: form.end_date,
        year: Number(form.year),
        semester: form.semester,
        worked_hours: form.worked_hours ? Number(form.worked_hours) : undefined,
      });

      setForm((prev) => ({
        ...prev,
        company_name: '',
        street: '',
        city: '',
        zip: '',
        start_date: '',
        end_date: '',
        worked_hours: '',
      }));

      await loadPractices();
      setShowForm(false);
    } catch (e) {
      setFormError('Prax sa nepodarilo uložiť. Skontroluj údaje alebo skús neskôr.');
    }
  }

  async function openDetail(id: number) {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetailError(null);
    setSelectedPractice(null);

    try {
      const res = await api.get<PracticeDetail>(`/api/student/internships/${id}`);
      setSelectedPractice(res.data);
    } catch (e) {
      setDetailError('Nepodarilo sa načítať detaily praxe.');
    } finally {
      setDetailLoading(false);
    }
  }

  function closeDetail() {
    setDetailOpen(false);
  }

  return (
    <AppLayoutSpa breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* sivý rámik a jemný tieň */}
        <Card className="bg-white/90 border border-green-200 shadow-sm">
          {/* HLAVIČKA S TLAČIDLOM "NOVÁ PRAX" */}
          <CardHeader className="flex flex-row items-center justify-between gap-4">
            <div>
              <CardTitle className="text-green-700">Moje praxe</CardTitle>
              <p className="mt-1 text-sm text-green-700">
                Tu vidíš prehľad svojich odborných praxí a môžeš pridať novú.
              </p>
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
            {/* ROZBAĽOVACÍ FORMULÁR POD HLAVIČKOU */}
            {showForm && (
              <div className="mb-6 rounded-lg border border-green-200 bg-green-50 p-4">
                <h2 className="mb-3 text-sm font-semibold text-green-800">
                  Pridať novú prax
                </h2>
                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-green-800">
                      Názov firmy *
                    </label>
                    <Input
                      name="company_name"
                      value={form.company_name}
                      onChange={handleChange}
                      placeholder="Fix-servis s.r.o."
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1 text-green-800">
                      Ulica
                    </label>
                    <Input
                      name="street"
                      value={form.street}
                      onChange={handleChange}
                      placeholder="Hlavná 123"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-green-800">
                        Mesto *
                      </label>
                      <Input
                        name="city"
                        value={form.city}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-green-800">
                        PSČ
                      </label>
                      <Input
                        name="zip"
                        value={form.zip}
                        onChange={handleChange}
                        placeholder="01001"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-green-800">
                        Štát
                      </label>
                      <Input
                        name="country"
                        value={form.country}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-green-800">
                        Dátum začiatku *
                      </label>
                      <Input
                        type="date"
                        name="start_date"
                        value={form.start_date}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-green-800">
                        Dátum konca *
                      </label>
                      <Input
                        type="date"
                        name="end_date"
                        value={form.end_date}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1 text-green-800">
                        Rok *
                      </label>
                      <Input
                        type="number"
                        name="year"
                        value={form.year}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 text-green-800">
                        Semester *
                      </label>
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
                      <label className="block text-sm font-medium mb-1 text-green-800">
                        Odpracované hodiny
                      </label>
                      <Input
                        type="number"
                        name="worked_hours"
                        value={form.worked_hours}
                        onChange={handleChange}
                        min={0}
                      />
                    </div>
                  </div>

                  {formError && (
                    <p className="text-sm text-red-600">
                      {formError}
                    </p>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      Zrušiť
                    </Button>
                    <Button type="submit">
                      Uložiť prax
                    </Button>
                  </div>
                </form>
              </div>
            )}

            {listError && (
              <p className="mb-3 text-sm text-red-600">
                {listError}
              </p>
            )}

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
                    <TableCell colSpan={4}>
                      Zatiaľ nemáš žiadnu prax.
                    </TableCell>
                  </TableRow>
                )}

                {!loading && practices.map((p) => (
                  <TableRow key={p.id} className="hover:bg-green-50">
                    <TableCell className="text-green-900">{p.firm}</TableCell>
                    <TableCell>{p.year}</TableCell>
                    <TableCell>
                      <Badge>{p.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDetail(p.id)}
                      >
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

      {/* NÁŠ VLASTNÝ MODAL S DETAILOM PRAXE */}
      {detailOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-lg rounded-xl bg-white shadow-lg border border-green-200 p-6">
            <div className="flex items-start justify_between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-green-900">Detail praxe</h2>
                <p className="text-sm text-green-700">
                  Podrobné informácie o tvojej odbornej praxi.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDetail}
                className="text-green-400 hover:text-green-600 text-xl leading-none"
              >
                ×
              </button>
            </div>

            <div className="mt-4 text-sm">
              {detailLoading && (
                <p className="text-green-700">Načítavam…</p>
              )}

              {detailError && (
                <p className="text-red-600">{detailError}</p>
              )}

              {!detailLoading && !detailError && selectedPractice && (
                <div className="space-y-3">
                  <div>
                    <p className="font-semibold text-green-800">Firma</p>
                    <p className="text-green-900">
                      {selectedPractice.company_name || '—'}
                    </p>
                  </div>

                  <div>
                    <p className="font-semibold text-green-800">Adresa</p>
                    <p className="text-green-900">
                      {[selectedPractice.street, selectedPractice.city]
                        .filter(Boolean)
                        .join(', ') || '—'}
                    </p>
                    <p className="text-green-900">
                      {[selectedPractice.zip, selectedPractice.country]
                        .filter(Boolean)
                        .join(' ') || ''}
                    </p>
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
                      <p className="text-green-900">
                        {selectedPractice.worked_hours ?? '—'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="font-semibold text-green-800">Stav</p>
                    <Badge className="mt-1">
                      {selectedPractice.status ?? '—'}
                    </Badge>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end">
              <Button variant="outline" onClick={closeDetail}>
                Zavrieť
              </Button>
            </div>
          </div>
        </div>
      )}
    </AppLayoutSpa>
  );
}
