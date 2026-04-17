"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Plus, Users, AlertTriangle, Download } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";
import type { StudentDTO } from "@/types";

function gradeBadgeVariant(score: number) {
  if (score >= 90) return "success";
  if (score >= 70) return "default";
  if (score >= 60) return "warning";
  return "destructive";
}

export default function StudentsPage() {
  const { isAdmin, isTeacher } = useAuth();
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [search, setSearch] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const [form, setForm] = useState({ name: "", email: "", password: "", group: "" });
  const [formError, setFormError] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  const fetchStudents = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (groupFilter) params.set("group", groupFilter);
      const data = await apiFetch<StudentDTO[]>(`/api/students?${params}`);
      setStudents(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, groupFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormLoading(true);
    try {
      await apiFetch("/api/students", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setDialogOpen(false);
      setForm({ name: "", email: "", password: "", group: "" });
      fetchStudents();
    } catch (e: unknown) {
      setFormError(e instanceof Error ? e.message : "Yaratishda xatolik");
    } finally {
      setFormLoading(false);
    }
  };

  const groups = [...new Set(students.map((s) => s.group))].sort();

  return (
    <div>
      <TopBar title="Talabalar" />
      <div className="p-6 space-y-5">
        {/* Asboblar paneli */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 justify-between">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Talabalarni qidiring…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setGroupFilter("")}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                groupFilter === "" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              Barchasi
            </button>
            {groups.map((g) => (
              <button
                key={g}
                onClick={() => setGroupFilter(g)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  groupFilter === g ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                }`}
              >
                {g}
              </button>
            ))}

            <div className="flex gap-2">
              {["xlsx","csv"].map(fmt => (
                <Button key={fmt} variant="outline" size="sm" asChild>
                  <a href={`/api/export?type=students&format=${fmt}`} download>
                    <Download className="h-3 w-3 mr-1" />{fmt.toUpperCase()}
                  </a>
                </Button>
              ))}
            </div>

            {(isAdmin || isTeacher) && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-1" />
                    Talaba qo&apos;shish
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Yangi Talaba Qo&apos;shish</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCreate} className="space-y-4 mt-2">
                    {formError && (
                      <p className="text-sm text-red-500">{formError}</p>
                    )}
                    <div className="space-y-1">
                      <Label>To&apos;liq ism</Label>
                      <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    </div>
                    <div className="space-y-1">
                      <Label>Elektron pochta</Label>
                      <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                    </div>
                    <div className="space-y-1">
                      <Label>Parol</Label>
                      <Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                    </div>
                    <div className="space-y-1">
                      <Label>Guruh / Sinf</Label>
                      <Input placeholder="mas. CS-101" value={form.group} onChange={(e) => setForm({ ...form, group: e.target.value })} required />
                    </div>
                    <Button type="submit" className="w-full" disabled={formLoading}>
                      {formLoading ? "Yaratilmoqda…" : "Talaba Yaratish"}
                    </Button>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Qisqa statistika */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card>
            <CardContent className="flex items-center gap-3 pt-5">
              <Users className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-xl font-bold">{students.length}</p>
                <p className="text-xs text-muted-foreground">Jami talabalar</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-5">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              <div>
                <p className="text-xl font-bold">{students.filter((s) => s.isAtRisk).length}</p>
                <p className="text-xs text-muted-foreground">Xavf ostida</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-3 pt-5">
              <div className="h-5 w-5 text-green-500 font-bold text-lg">#</div>
              <div>
                <p className="text-xl font-bold">{groups.length}</p>
                <p className="text-xs text-muted-foreground">Guruhlar</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Talabalar jadvali */}
        <Card>
          <CardHeader>
            <CardTitle>Talabalar Ro&apos;yxati</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : error ? (
              <p className="text-center py-8 text-red-500">{error}</p>
            ) : students.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Talabalar topilmadi</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ism</TableHead>
                    <TableHead>Elektron pochta</TableHead>
                    <TableHead>Guruh</TableHead>
                    <TableHead>O&apos;rt. Ball</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead>Baholar</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.user.name}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{student.user.email}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">{student.group}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={gradeBadgeVariant(student.averageScore ?? 0)}>
                          {student.averageScore ?? 0}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {student.isAtRisk ? (
                          <Badge variant="destructive">Xavf ostida</Badge>
                        ) : (
                          <Badge variant="success">Yaxshi</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {student.grades?.length ?? 0} fan
                      </TableCell>
                      <TableCell>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/students/${student.id}`}>Ko&apos;rish</Link>
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
    </div>
  );
}
