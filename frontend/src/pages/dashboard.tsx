import { useEffect, useState } from 'react';
import AppLayoutSpa from '@/ui/AppLayoutSpa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Practice = { id: number; student: string; program: string; firm: string; year: number; status: string };
type Filter = { status: string; year: string; search: string; program: string };

const breadcrumbs = [{ title: 'Dashboard garanta', href: '/dashboard' }];

export default function DashboardGarant() {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [filter, setFilter] = useState<Filter>({ status: '', year: '', search: '', program: '' });

  useEffect(() => {
    document.title = 'Dashboard';
    setPractices([
      { id: 1, student: 'Ondrej Malý', program: 'AI22m', firm: 'TechCorp s.r.o.', year: 2025, status: 'Vytvorená' },
      { id: 2, student: 'Andrea Čačková', program: 'AI22m', firm: 'Innova s.r.o.', year: 2025, status: 'Potvrdená' },
    ]);
  }, []);

  const filtered = practices.filter((p) =>
    (!filter.status || p.status === filter.status) &&
    (!filter.year || String(p.year) === filter.year) &&
    (!filter.program || p.program === filter.program) &&
    (!filter.search || [p.student, p.firm].some((s) => s.toLowerCase().includes(filter.search.toLowerCase())))
  );

  return (
    <AppLayoutSpa breadcrumbs={breadcrumbs}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Prehľad praxí</h1>
          <div className="flex items-center gap-2">
            <Input placeholder="Hľadať študenta / firmu" value={filter.search} onChange={(e) => setFilter({ ...filter, search: e.target.value })} />
            <Select value={filter.status} onChange={(e) => setFilter({ ...filter, status: e.target.value })}>
              <option value="">Stav</option>
              <option value="Vytvorená">Vytvorená</option>
              <option value="Potvrdená">Potvrdená</option>
            </Select>
            <Select value={filter.year} onChange={(e) => setFilter({ ...filter, year: e.target.value })}>
              <option value="">Rok</option>
              <option value="2025">2025</option>
            </Select>
            <Button>Filtrovať</Button>
          </div>
        </div>
        <Card className="bg-white/90 border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Zoznam praxí</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Študent</TableHead>
                  <TableHead>Odbor</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead>Rok</TableHead>
                  <TableHead>Stav</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.student}</TableCell>
                    <TableCell>{p.program}</TableCell>
                    <TableCell>{p.firm}</TableCell>
                    <TableCell>{p.year}</TableCell>
                    <TableCell>
                      <Badge className="border-indigo-400 text-indigo-600 bg-indigo-50">{p.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppLayoutSpa>
  );
}

