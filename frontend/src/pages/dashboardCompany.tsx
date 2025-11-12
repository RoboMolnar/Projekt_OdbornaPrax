import { useEffect, useState } from 'react';
import AppLayoutSpa from '@/ui/AppLayoutSpa';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

type Practice = { id: number; student: string; program: string; year: number; status: string };
const breadcrumbs = [{ title: 'Dashboard firmy', href: '/dashboard-company' }];

export default function DashboardCompany() {
  const [practices, setPractices] = useState<Practice[]>([]);
  useEffect(() => {
    document.title = 'Dashboard firmy';
    setPractices([{ id: 1, student: 'Adam Firma', program: 'AI22m', year: 2025, status: 'Vytvorená' }]);
  }, []);

  return (
    <AppLayoutSpa breadcrumbs={breadcrumbs}>
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
                <TableHead>Rok</TableHead>
                <TableHead>Stav</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {practices.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.student}</TableCell>
                  <TableCell>{p.program}</TableCell>
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
    </AppLayoutSpa>
  );
}

