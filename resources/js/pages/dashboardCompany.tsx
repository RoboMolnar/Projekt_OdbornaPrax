import { useEffect, useState } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table"; // relatívne k /pages/

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────

type Practice = {
  id: number;
  student: string;
  program: string; // odbor
  position: string; // pozícia v praxi
  mentor: string; // firemný mentor
  year: number;
  status: "Vytvorená" | "Potvrdená" | "Schválená" | "Obhájená";
};

type Filter = {
  status: string;
  year: string;
  search: string; // študent/pozícia/garant
  program: string;
};

const breadcrumbs = [{ title: "Dashboard", href: "/company/dashboard" }];

export default function DashboardCompany() {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [filter, setFilter] = useState<Filter>({ status: "", year: "", search: "", program: "" });

  useEffect(() => {
    // Simulované dáta – len praxe danej firmy
    setPractices([
      { id: 1, student: "Ján Novák", program: "AI22m", position: "Frontend stážista", mentor: "M. Kováč", year: 2025, status: "Vytvorená" },
      { id: 2, student: "Petra Kováčová", program: "AI22m", position: "Data Analyst Trainee", mentor: "M. Kováč", year: 2025, status: "Potvrdená" },
      { id: 3, student: "Marek Hruška", program: "AI22b", position: "QA Intern", mentor: "M. Kováč", year: 2024, status: "Schválená" },
    ]);
  }, []);

  // Filtrovanie – rovnaký UX ako v garant/študent dashboarde
  const filtered = practices.filter((p) => {
    const matchesStatus = !filter.status || p.status === filter.status;
    const matchesYear = !filter.year || p.year.toString() === filter.year;
    const q = filter.search.trim().toLowerCase();
    const matchesSearch = !q || p.student.toLowerCase().includes(q) || p.position.toLowerCase().includes(q) || p.mentor.toLowerCase().includes(q);
    const matchesProgram = !filter.program || p.program === filter.program;
    return matchesStatus && matchesYear && matchesSearch && matchesProgram;
  });

  // Stub na stiahnutie PDF (nahradíš backend route)
  const handleDownloadPdf = (p: Practice) => {
    const content = `\nPRAKTICKÁ SPRÁVA – FIRMA\n-----------------------\nŠtudent: ${p.student}\nOdbor: ${p.program}\nPozícia: ${p.position}\nMentor: ${p.mentor}\nRok: ${p.year}\nStav: ${p.status}\n`;
    const blob = new Blob([content], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prax_${p.student.replace(/\s+/g, "_")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard firmy" />
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900 p-6">
        {/* HLAVIČKA – vizuál ako garant */}
        <div className="mt-4 flex flex-col md:flex-row justify-between items-center gap-3">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">Prehľad študentov vo firme</h1>
          <Button className="bg-gradient-to-tr from-indigo-500 to-sky-500 text-white shadow-md hover:shadow-lg">
            + Nová prax
          </Button>
        </div>

        {/* FILTRE – rovnaké pill/rounded prvky */}
        <div className="mt-4 flex flex-wrap gap-3 rounded-xl border border-slate-200 bg-white/80 p-4 shadow-sm">
          <Select value={filter.status} onValueChange={(v) => setFilter((f) => ({ ...f, status: v === "all" ? "" : v }))}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Stav praxe" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všetky</SelectItem>
              <SelectItem value="Vytvorená">Vytvorená</SelectItem>
              <SelectItem value="Potvrdená">Potvrdená</SelectItem>
              <SelectItem value="Schválená">Schválená</SelectItem>
              <SelectItem value="Ukončená">Obhájená</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filter.program} onValueChange={(v) => setFilter((f) => ({ ...f, program: v === "all" ? "" : v }))}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Odbor" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Všetky</SelectItem>
              <SelectItem value="AI22m">AI22m</SelectItem>
              <SelectItem value="AI22b">AI22b</SelectItem>
            </SelectContent>
          </Select>

          <Input placeholder="Rok..." className="w-[120px]" inputMode="numeric" onChange={(e) => setFilter((f) => ({ ...f, year: e.target.value }))} />
          <Input placeholder="Vyhľadať študenta alebo garanta..." className="w-[320px]" onChange={(e) => setFilter((f) => ({ ...f, search: e.target.value }))} />
        </div>

        {/* TABUĽKA – stĺpce pre firmu, vizuál ako u garanta */}
        <Card className="mt-4 bg-white/90 border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-slate-800">Zoznam študentov</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Študent</TableHead>
                  <TableHead>Odbor</TableHead>
                  <TableHead>Pozícia</TableHead>
                  <TableHead>Garant</TableHead>
                  <TableHead>Rok</TableHead>
                  <TableHead>Stav</TableHead>
                  <TableHead>Akcie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length > 0 ? (
                  filtered.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-semibold text-slate-900">{p.student}</TableCell>
                      <TableCell>{p.program}</TableCell>
                      <TableCell className="text-slate-700">{p.position}</TableCell>
                      <TableCell className="text-slate-700">{p.mentor}</TableCell>
                      <TableCell>{p.year}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="border-indigo-400 bg-indigo-50 text-indigo-600">{p.status}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {/* Detail – čierny pill */}
                          <Button variant="secondary" size="sm" className="rounded-xl bg-neutral-900 text-white hover:bg-neutral-800">Detail</Button>
                          {/* PDF – modrofialový */}
                          <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(p)} className="border-slate-300 text-indigo-600 transition hover:bg-indigo-50 hover:text-indigo-800">📄 Stiahnuť PDF</Button>
                          {/* Zmazať – ružový */}
                          <Button variant="destructive" size="sm" className="bg-gradient-to-tr from-red-500 to-pink-500 text-white transition hover:from-red-400 hover:to-pink-400 hover:shadow-md">Zmazať</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    {/* Ak by tvoje TableCell ešte nepoznalo colSpan, nechaj natívne <td> */}
                    <td colSpan={7} className="py-4 w-full text-center text-slate-500">Žiadne záznamy nevyhovujú zadaným kritériám.</td>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* FOOTER */}
        <footer className="mt-10 text-center text-xs text-slate-500">© {new Date().getFullYear()} Portál praxe. Všetky práva vyhradené.</footer>
      </div>
    </AppLayout>
  );
}
