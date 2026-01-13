import { useState, useEffect } from "react";
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
} from "../components/ui/table";

type Practice = {
  id: number;
  student: string;
  program: string;
  firm: string;
  year: number;
  status: string;
};

type Filter = {
  status: string;
  year: string;
  search: string;
  program: string;
};

const breadcrumbs = [{ title: "Dashboard garanta", href: "/dashboard" }];

export default function Dashboard() {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [filter, setFilter] = useState<Filter>({
    status: "",
    year: "",
    search: "",
    program: "",
  });

  useEffect(() => {
    setPractices([
      {
        id: 1,
        student: "Ondrej Malý",
        program: "AI22m",
        firm: "TechCorp s.r.o.",
        year: 2025,
        status: "Vytvorená",
      },
      {
        id: 2,
        student: "Andrea Ťažká",
        program: "AI22m",
        firm: "SoftVision",
        year: 2025,
        status: "Potvrdená",
      },
      {
        id: 3,
        student: "Adam Dostal",
        program: "AI22b",
        firm: "Datacom",
        year: 2024,
        status: "Schválená",
      },
    ]);
  }, []);

  // 🧾 Sťahovanie PDF (rovnaký štýl ako v DashboardStudent)
  const handleDownloadPdf = (p: Practice) => {
    const content = `
      PRAKTICKÁ SPRÁVA
      -----------------
      Študent: ${p.student}
      Odbor: ${p.program}
      Firma: ${p.firm}
      Rok: ${p.year}
      Stav: ${p.status}
    `;
    const blob = new Blob([content], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `prax_${p.student.replace(/\s+/g, "_")}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = practices.filter((p) => {
    const matchesStatus = !filter.status || p.status === filter.status;
    const matchesYear = !filter.year || p.year.toString() === filter.year;
    const matchesSearch =
      !filter.search ||
      p.student.toLowerCase().includes(filter.search.toLowerCase()) ||
      p.firm.toLowerCase().includes(filter.search.toLowerCase());
    const matchesProgram = !filter.program || p.program === filter.program;
    return matchesStatus && matchesYear && matchesSearch && matchesProgram;
  });

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard garanta" />
      <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900 p-6">
        <div className="mt-4 flex flex-col gap-6">
          {/* Hlavička */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
              Prehľad odborných praxí
            </h1>
            <Button className="bg-gradient-to-tr from-indigo-500 to-sky-500 text-white shadow-md hover:shadow-lg">
              + Nová prax
            </Button>
          </div>

          {/* Filtre */}
          <div className="flex flex-wrap gap-3 bg-white/80 border border-slate-200 rounded-xl p-4 shadow-sm">
            <Select
              value={filter.status}
              onValueChange={(v) =>
                setFilter((f) => ({ ...f, status: v === "all" ? "" : v }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Stav praxe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všetky</SelectItem>
                <SelectItem value="Vytvorená">Vytvorená</SelectItem>
                <SelectItem value="Potvrdená">Potvrdená</SelectItem>
                <SelectItem value="Schválená">Schválená</SelectItem>
                <SelectItem value="Obhájená">Obhájená</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filter.program}
              onValueChange={(v) =>
                setFilter((f) => ({ ...f, program: v === "all" ? "" : v }))
              }
            >
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Odbor" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Všetky</SelectItem>
                <SelectItem value="AI22m">AI22m</SelectItem>
                <SelectItem value="AI22b">AI22b</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Rok..."
              className="w-[120px]"
              onChange={(e) =>
                setFilter((f) => ({ ...f, year: e.target.value }))
              }
            />

            <Input
              placeholder="Vyhľadať študenta alebo firmu..."
              className="w-[260px]"
              onChange={(e) =>
                setFilter((f) => ({ ...f, search: e.target.value }))
              }
            />
          </div>

          {/* Tabuľka */}
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
                    <TableHead>Akcie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length > 0 ? (
                    filtered.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>{p.student}</TableCell>
                        <TableCell>{p.program}</TableCell>
                        <TableCell>{p.firm}</TableCell>
                        <TableCell>{p.year}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="border-indigo-400 text-indigo-600 bg-indigo-50"
                          >
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {/* Detail */}
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-slate-300 text-slate-700 hover:bg-slate-100"
                            >
                              Detail
                            </Button>

                            {/* PDF tlačidlo – rovnaké ako v DashboardStudent */}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDownloadPdf(p)}
                              className="border-slate-300 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 transition"
                            >
                              📄 Stiahnuť PDF
                            </Button>

                            {/* Zmazať */}
                            <Button
                              variant="destructive"
                              size="sm"
                              className="bg-gradient-to-tr from-red-500 to-pink-500 text-white hover:from-red-400 hover:to-pink-400 hover:shadow-md transition-all"
                            >
                              Zmazať
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      {/* Bez colSpan, aby nepadal TS */}
                      <td className="text-center text-slate-500 py-4 w-full">
                        Žiadne záznamy nevyhovujú zadaným kritériám.
                      </td>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* FOOTER */}
        <footer className="mt-10 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} Portál praxe. Všetky práva vyhradené.
        </footer>
      </div>
    </AppLayout>
  );
}
