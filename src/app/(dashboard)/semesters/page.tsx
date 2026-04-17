"use client";

import { useEffect, useState } from "react";
import { Plus, Calendar, CheckCircle, BookOpen } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { apiFetch } from "@/hooks/useApi";
import { useAuth } from "@/contexts/AuthContext";

interface Semester {
  id: string;
  name: string;
  year: number;
  term: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  _count: { grades: number };
}

export default function SemestersPage() {
  const { isAdmin } = useAuth();
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", year: new Date().getFullYear().toString(),
    term: "Fall", startDate: "", endDate: "", isActive: false,
  });

  const load = () => {
    apiFetch<Semester[]>("/api/semesters").then(setSemesters).finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError("");
    try {
      await apiFetch("/api/semesters", {
        method: "POST",
        body: JSON.stringify({ ...form, year: parseInt(form.year) }),
      });
      setOpen(false);
      load();
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Xatolik"); }
  };

  const termLabels: Record<string, string> = {
    Spring: "Bahor",
    Fall: "Kuz",
    Summer: "Yoz",
  };

  return (
    <div>
      <TopBar title="Semestrlar" />
      <div className="p-6 space-y-5">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">O&apos;quv semestrlarini boshqaring</p>
          {isAdmin && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="h-4 w-4 mr-1" />Yangi Semestr</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Semestr Yaratish</DialogTitle></DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                  {error && <p className="text-sm text-red-500">{error}</p>}
                  <div className="space-y-1">
                    <Label>Nomi (mas. 2024 Bahor)</Label>
                    <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Yil</Label>
                      <Input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} required />
                    </div>
                    <div className="space-y-1">
                      <Label>Davr</Label>
                      <Select value={form.term} onValueChange={v => setForm({ ...form, term: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Spring">Bahor</SelectItem>
                          <SelectItem value="Fall">Kuz</SelectItem>
                          <SelectItem value="Summer">Yoz</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label>Boshlanish sanasi</Label>
                      <Input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} required />
                    </div>
                    <div className="space-y-1">
                      <Label>Tugash sanasi</Label>
                      <Input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} required />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })} className="rounded" />
                    <span className="text-sm">Faol semestr sifatida belgilash</span>
                  </label>
                  <Button type="submit" className="w-full">Yaratish</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {semesters.length === 0 ? (
              <p className="col-span-3 text-center py-12 text-muted-foreground">Semestrlar yo&apos;q. Boshlash uchun bitta yarating.</p>
            ) : semesters.map(s => (
              <Card key={s.id} className={s.isActive ? "border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800" : ""}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{s.name}</CardTitle>
                    {s.isActive && <Badge variant="success"><CheckCircle className="h-3 w-3 mr-1" />Faol</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {new Date(s.startDate).toLocaleDateString("uz-UZ")} – {new Date(s.endDate).toLocaleDateString("uz-UZ")}
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    {s._count.grades} ta baho
                  </div>
                  <Badge variant="secondary">{termLabels[s.term] ?? s.term} {s.year}</Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
