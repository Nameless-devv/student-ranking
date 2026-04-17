"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Calculator } from "lucide-react";
import Link from "next/link";
import TopBar from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/hooks/useApi";
import { calculateTotalScore, calculateGradeLetter } from "@/utils/grading";
import type { StudentDTO, SubjectDTO } from "@/types";

interface Semester { id: string; name: string; isActive: boolean }

export default function AddGradePage() {
  const router = useRouter();
  const [students, setStudents] = useState<StudentDTO[]>([]);
  const [subjects, setSubjects] = useState<SubjectDTO[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [addingSubject, setAddingSubject] = useState(false);

  const [form, setForm] = useState({
    studentId: "",
    subjectId: "",
    semesterId: "",
    attendance: "0",
    homework: "0",
    midterm: "0",
    final: "0",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const preview = calculateTotalScore({
    attendance: parseFloat(form.attendance) || 0,
    homework: parseFloat(form.homework) || 0,
    midterm: parseFloat(form.midterm) || 0,
    final: parseFloat(form.final) || 0,
  });
  const previewGrade = calculateGradeLetter(preview);

  useEffect(() => {
    Promise.all([
      apiFetch<StudentDTO[]>("/api/students"),
      apiFetch<SubjectDTO[]>("/api/subjects"),
      apiFetch<Semester[]>("/api/semesters"),
    ]).then(([s, sub, sem]) => {
      setStudents(s);
      setSubjects(sub);
      setSemesters(sem);
      const active = sem.find(x => x.isActive);
      if (active) setForm(f => ({ ...f, semesterId: active.id }));
    });
  }, []);

  const handleAddSubject = async () => {
    if (!newSubjectName.trim()) return;
    setAddingSubject(true);
    try {
      const s = await apiFetch<SubjectDTO>("/api/subjects", {
        method: "POST",
        body: JSON.stringify({ name: newSubjectName }),
      });
      setSubjects((prev) => [...prev, s]);
      setForm((f) => ({ ...f, subjectId: s.id }));
      setNewSubjectName("");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Fan qo'shishda xatolik");
    } finally {
      setAddingSubject(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!form.studentId || !form.subjectId) {
      setError("Talaba va fanni tanlang");
      return;
    }

    setLoading(true);
    try {
      await apiFetch("/api/grades", {
        method: "POST",
        body: JSON.stringify({
          studentId: form.studentId,
          subjectId: form.subjectId,
          ...(form.semesterId && form.semesterId !== "none" ? { semesterId: form.semesterId } : {}),
          attendance: parseFloat(form.attendance),
          homework: parseFloat(form.homework),
          midterm: parseFloat(form.midterm),
          final: parseFloat(form.final),
        }),
      });
      setSuccess("Baho muvaffaqiyatli saqlandi!");
      setForm((f) => ({ ...f, studentId: "", subjectId: "", attendance: "0", homework: "0", midterm: "0", final: "0" }));
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Bahoni saqlashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  void router;

  const gradeColors: Record<string, string> = {
    "5": "success",
    "4": "default",
    "3": "warning",
    "2": "destructive",
  } as const;

  return (
    <div>
      <TopBar title="Baho Qo'shish / Yangilash" />
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/students">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Talabalarga qaytish
          </Link>
        </Button>

        {/* Jonli hisoblash ko'rinishi */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20">
          <CardContent className="flex items-center gap-4 pt-5">
            <Calculator className="h-8 w-8 text-blue-600" />
            <div>
              <p className="text-sm text-muted-foreground">
                Formula: 0.1×Davomat + 0.2×Uy vazifasi + 0.3×Oraliq + 0.4×Final
              </p>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-3xl font-bold text-blue-600">{preview}</span>
                <Badge variant={gradeColors[previewGrade] as "success" | "default" | "warning" | "destructive"}>
                  Baho {previewGrade}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Baho Kiritish</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}
              {success && (
                <div className="rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 p-3 text-sm text-green-600">
                  {success}
                </div>
              )}

              {/* Talaba */}
              <div className="space-y-1.5">
                <Label>Talaba</Label>
                <Select value={form.studentId} onValueChange={(v) => setForm({ ...form, studentId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Talabani tanlang" />
                  </SelectTrigger>
                  <SelectContent>
                    {students.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.user.name} — {s.group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Fan */}
              <div className="space-y-1.5">
                <Label>Fan</Label>
                <div className="flex gap-2">
                  <Select value={form.subjectId} onValueChange={(v) => setForm({ ...form, subjectId: v })}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Fanni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Tezkor fan qo'shish */}
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="Yangi fan nomi…"
                    value={newSubjectName}
                    onChange={(e) => setNewSubjectName(e.target.value)}
                    className="text-sm"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddSubject}
                    disabled={addingSubject || !newSubjectName.trim()}
                  >
                    {addingSubject ? "Qo'shilmoqda…" : "Qo'shish"}
                  </Button>
                </div>
              </div>

              {/* Semestr */}
              {semesters.length > 0 && (
                <div className="space-y-1.5">
                  <Label>Semestr (ixtiyoriy)</Label>
                  <Select value={form.semesterId} onValueChange={v => setForm({ ...form, semesterId: v })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Semestrni tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Semestrsiz</SelectItem>
                      {semesters.map(s => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}{s.isActive ? " (Faol)" : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Ball kiritish maydonlari */}
              <div className="grid grid-cols-2 gap-4">
                {(["attendance", "homework", "midterm", "final"] as const).map((field) => {
                  const labels = {
                    attendance: "Davomat (0-100) × 10%",
                    homework: "Uy vazifasi (0-100) × 20%",
                    midterm: "Oraliq (0-100) × 30%",
                    final: "Final imtihon (0-100) × 40%",
                  };
                  return (
                    <div key={field} className="space-y-1.5">
                      <Label>{labels[field]}</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={form[field]}
                        onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                        required
                      />
                    </div>
                  );
                })}
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Saqlanmoqda…" : "Bahoni Saqlash"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
