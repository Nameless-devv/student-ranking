"use client";

import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, ArcElement,
  LineElement, PointElement, RadialLinearScale, Filler,
  Title, Tooltip, Legend,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/hooks/useApi";
import type { AnalyticsData } from "@/types";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, ArcElement,
  LineElement, PointElement, RadialLinearScale, Filler,
  Title, Tooltip, Legend
);

interface Semester { id: string; name: string; isActive: boolean }

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<AnalyticsData>("/api/analytics"),
      apiFetch<Semester[]>("/api/semesters"),
    ])
      .then(([a, s]) => {
        setData(a);
        setSemesters(s);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex h-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
    </div>
  );
  if (error || !data) return <div className="p-6 text-red-500">Yuklashda xatolik: {error}</div>;

  const gradeDonut = {
    labels: ["5 — A'lo (86-100)", "4 — Yaxshi (71-85)", "3 — Qoniqarli (56-70)", "2 — Qoniqarsiz (<56)"],
    datasets: [{
      data: [data.gradeDistribution["5"], data.gradeDistribution["4"], data.gradeDistribution["3"], data.gradeDistribution["2"]],
      backgroundColor: ["#22c55e", "#3b82f6", "#f59e0b", "#f97316", "#ef4444"],
      borderWidth: 2,
      borderColor: "rgba(255,255,255,0.5)",
    }],
  };

  const subjectBar = {
    labels: data.subjectPerformance.map(s => s.subjectName),
    datasets: [{
      label: "O'rtacha ball",
      data: data.subjectPerformance.map(s => s.averageScore),
      backgroundColor: data.subjectPerformance.map(s =>
        s.averageScore >= 80 ? "rgba(34,197,94,0.8)" : s.averageScore >= 60 ? "rgba(59,130,246,0.8)" : "rgba(239,68,68,0.8)"
      ),
      borderRadius: 6,
    }],
  };

  const distBar = {
    labels: ["5 — A'lo", "4 — Yaxshi", "3 — Qoniqarli", "2 — Qoniqarsiz"],
    datasets: [{
      label: "Talabalar",
      data: [data.gradeDistribution["5"], data.gradeDistribution["4"], data.gradeDistribution["3"], data.gradeDistribution["2"]],
      backgroundColor: ["#22c55e", "#3b82f6", "#f59e0b", "#f97316", "#ef4444"],
      borderRadius: 6,
    }],
  };

  const topStudentsLine = {
    labels: ["Davomat", "Uy vazifasi", "Oraliq", "Final", "Jami"],
    datasets: data.topStudents.slice(0, 5).map((s, i) => {
      const colors = ["#3b82f6", "#22c55e", "#f59e0b", "#a855f7", "#ef4444"];
      const g = s.grades ?? [];
      type GradeField = "attendance" | "homework" | "midterm" | "final" | "totalScore";
      const avg = (field: GradeField) =>
        g.length ? Math.round(g.reduce((a: number, b) => a + b[field], 0) / g.length * 10) / 10 : 0;
      return {
        label: s.user.name.split(" ")[0],
        data: [avg("attendance"), avg("homework"), avg("midterm"), avg("final"), s.averageScore],
        borderColor: colors[i],
        backgroundColor: colors[i] + "20",
        fill: false,
        tension: 0.3,
      };
    }),
  };

  const studentCountBar = {
    labels: data.subjectPerformance.map(s => s.subjectName),
    datasets: [{
      label: "Ro'yxatdagi talabalar",
      data: data.subjectPerformance.map(s => s.studentCount),
      backgroundColor: "rgba(99,102,241,0.7)",
      borderRadius: 6,
    }],
  };

  const totalGrades = Object.values(data.gradeDistribution).reduce((a, b) => a + b, 0);
  const passRate = totalGrades > 0
    ? Math.round(((data.gradeDistribution.A + data.gradeDistribution.B + data.gradeDistribution.C) / totalGrades) * 100)
    : 0;

  return (
    <div>
      <TopBar title="Tahlil" />
      <div className="p-6 space-y-6">

        {/* Umumiy statistika */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Jami talabalar",    value: data.totalStudents,           color: "text-blue-600" },
            { label: "Umumiy o'rt. ball", value: `${data.averageScore}%`,       color: "text-green-600" },
            { label: "O'tish darajasi",   value: `${passRate}%`,                color: "text-purple-600" },
            { label: "Xavf ostida",       value: data.atRiskStudents.length,    color: "text-red-600" },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-5 pb-4">
                <p className={`text-3xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-sm text-muted-foreground mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Semestrlar */}
        {semesters.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {semesters.map(s => (
              <Badge key={s.id} variant={s.isActive ? "default" : "secondary"}>
                {s.isActive ? "● " : ""}{s.name}
              </Badge>
            ))}
          </div>
        )}

        {/* Baholar taqsimoti */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader><CardTitle>Baholar Taqsimoti</CardTitle></CardHeader>
            <CardContent className="flex flex-col items-center gap-4">
              <div className="w-64 h-64">
                <Doughnut data={gradeDonut} options={{ cutout: "60%", plugins: { legend: { position: "bottom" } } }} />
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {Object.entries(data.gradeDistribution).map(([letter, count]) => (
                  <Badge key={letter} variant="outline">Baho {letter}: {count} ta</Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Ball Taqsimoti</CardTitle></CardHeader>
            <CardContent>
              <Bar
                data={distBar}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, title: { display: true, text: "Talabalar" } } },
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Eng yaxshi talabalar trendi */}
        {data.topStudents.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle>Eng Yaxshi Talabalar — Ball Komponentlari Trendi</CardTitle>
            </CardHeader>
            <CardContent>
              <Line
                data={topStudentsLine}
                options={{
                  responsive: true,
                  plugins: { legend: { position: "bottom" } },
                  scales: {
                    y: { beginAtZero: true, max: 100, title: { display: true, text: "Ball" } },
                  },
                }}
              />
              <p className="text-xs text-muted-foreground text-center mt-2">
                Har bir komponentning o&apos;rtachasi (Davomat, Uy vazifasi, Oraliq, Final, Umumiy) eng yaxshi talabalar bo&apos;yicha
              </p>
            </CardContent>
          </Card>
        )}

        {/* Fan ko'rsatkichlari */}
        <Card>
          <CardHeader><CardTitle>Fan Ko&apos;rsatkichlari Taqqoslash</CardTitle></CardHeader>
          <CardContent>
            {data.subjectPerformance.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Fan ma&apos;lumotlari yo&apos;q</p>
            ) : (
              <Bar
                data={subjectBar}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: "O'rtacha ball" } } },
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Ro'yxat va progress panellari */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {data.subjectPerformance.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Fan Bo&apos;yicha Talabalar Soni</CardTitle></CardHeader>
              <CardContent>
                <Bar
                  data={studentCountBar}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, title: { display: true, text: "Talabalar" } } },
                  }}
                />
              </CardContent>
            </Card>
          )}

          {data.subjectPerformance.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Fan Progress Panellari</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {data.subjectPerformance.map(s => (
                  <div key={s.subjectName} className="flex items-center gap-3">
                    <p className="w-32 text-sm font-medium truncate">{s.subjectName}</p>
                    <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full transition-all ${
                          s.averageScore >= 80 ? "bg-green-500" : s.averageScore >= 60 ? "bg-blue-500" : "bg-red-500"
                        }`}
                        style={{ width: `${s.averageScore}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold w-12 text-right">{s.averageScore}%</span>
                    <Badge variant="secondary" className="hidden sm:inline-flex">{s.studentCount} tal.</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Eksport tugmalari */}
        <Card>
          <CardHeader><CardTitle>Hisobotlarni Eksport Qilish</CardTitle></CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {[
              { label: "Talabalar Excel", href: "/api/export?type=students&format=xlsx" },
              { label: "Talabalar CSV",   href: "/api/export?type=students&format=csv" },
              { label: "Baholar Excel",   href: "/api/export?type=grades&format=xlsx" },
              { label: "Baholar CSV",     href: "/api/export?type=grades&format=csv" },
              { label: "Reyting",         href: "/api/export?type=leaderboard&format=xlsx" },
            ].map(e => (
              <Button key={e.label} variant="outline" size="sm" asChild>
                <a href={e.href} download>{e.label}</a>
              </Button>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
