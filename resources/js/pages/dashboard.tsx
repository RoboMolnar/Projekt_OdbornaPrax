import { useState, useEffect } from "react";
import AppLayout from "@/layouts/app-layout";
import { Head } from "@inertiajs/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";

// ✅ typy
type Practice = {
  id: number;
  student: string;
  firm: string;
  year: number;
  status: string;
};

type Filter = {
  status: string;
  year: string;
};

const breadcrumbs = [{ title: "Dashboard", href: "/dashboard" }];

export default function Dashboard() {
  const [practices, setPractices] = useState<Practice[]>([]);
  const [filter, setFilter] = useState<Filter>({ status: "", year: "" });

  useEffect(() => {
    // simulované dáta
    setPractices([
      { id: 1, student: "Ján Novák", firm: "TechCorp s.r.o.", year: 2025, status: "Vytvorená" },
      { id: 2, student: "Petra Kováčová", firm: "SoftVision", year: 2025, status: "Potvrdená" },
      { id: 3, student: "Marek Hruška", firm: "Datacom", year: 2024, status: "Schválená" },
    ]);
  }, []);

  const filtered = practices.filter(
    (p) =>
      (!filter.status || p.status === filter.status) &&
      (!filter.year || p.year.toString() === filter.year)
  );

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Dashboard" />
      <div className="flex flex-col gap-6 p-4">
        {/* Hlavička */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <h1 className="text-2xl font-semibold">Prehľad odborných praxí</h1>
          <Button variant="default">+ Nová prax</Button>
        </div>

        {/* Filtre */}
        <div className="flex flex-wrap gap-3">
          <Select onValueChange={(v) => setFilter((f) => ({ ...f, status: v }))}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrovať podľa stavu" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Vytvorená">Vytvorená</SelectItem>
              <SelectItem value="Potvrdená">Potvrdená</SelectItem>
              <SelectItem value="Schválená">Schválená</SelectItem>
              <SelectItem value="Obhájená">Obhájená</SelectItem>
            </SelectContent>
          </Select>

          <Input
            placeholder="Rok..."
            className="w-[120px]"
            onChange={(e) => setFilter((f) => ({ ...f, year: e.target.value }))}
          />
        </div>

        {/* Tabuľka praxí */}
        <Card>
          <CardHeader>
            <CardTitle>Zoznam praxí</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Študent</TableHead>
                  <TableHead>Firma</TableHead>
                  <TableHead>Rok</TableHead>
                  <TableHead>Stav</TableHead>
                  <TableHead>Akcie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>{p.student}</TableCell>
                    <TableCell>{p.firm}</TableCell>
                    <TableCell>{p.year}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{p.status}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="secondary" size="sm">
                          Detail
                        </Button>
                        <Button variant="destructive" size="sm">
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
    </AppLayout>
  );
}
