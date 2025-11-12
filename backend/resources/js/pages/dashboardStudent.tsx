import { useState, useEffect } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Practice = {
  id: number;
  firm: string;
  program: string;
  year: number;
  status: string;
};

const breadcrumbs = [{ title: "Dashboard študenta", href: "/dashboard" }];

export default function DashboardStudent() {
  const [practices, setPractices] = useState<Practice[]>([]);

  useEffect(() => {
    setPractices([
      { id: 1, firm: "Fix-servis s.r.o.", program: "AI22m", year: 2025, status: "Vytvorená" },
    ]);
  }, []);


  const handleDownload = (practice: Practice) => {

    alert(` Sťahujem PDF pre prax: ${practice.firm}`);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard študenta" />
      <div
        className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-slate-100 text-slate-900 p-6"
        data-theme="light"
      >
        <div className="mt-4 flex flex-col gap-6">
          {/* Hlavička */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-3">
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
              Moje odborné praxe
            </h1>
            <Button className="bg-gradient-to-tr from-indigo-500 to-sky-500 text-white shadow-md hover:shadow-lg">
              + Nová prax
            </Button>
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
                    <TableHead>Firma</TableHead>
                    <TableHead>Odbor</TableHead>
                    <TableHead>Rok</TableHead>
                    <TableHead>Stav</TableHead>
                    <TableHead>Akcie</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {practices.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{p.firm}</TableCell>
                      <TableCell>{p.program}</TableCell>
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
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-300 text-slate-700 hover:bg-slate-100"
                          >
                            Detail
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDownload(p)}
                            className="border-slate-300 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-800 transition"
                          >
                            📄 Stiahnuť PDF
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            className="bg-gradient-to-tr from-red-500 to-pink-500 text-white hover:from-red-400 hover:to-pink-400 hover:shadow-md transition-all duration-200"
                          >
                            Zmazať
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
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
