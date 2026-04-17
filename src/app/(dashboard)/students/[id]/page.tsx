"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft, BookOpen, AlertTriangle, TrendingUp, Brain, Download, Star,
} from "lucide-react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  RadialLinearScale, PointElement, LineElement, Filler, Title, Tooltip, Legend,
} from "chart.js";
import { Bar, Radar, Line } from "react-chartjs-2";
import TopBar from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/hooks/useApi";
import type { StudentDTO } from "@/types";

ChartJS.register(
  CategoryScale, LinearScale, BarElement, RadialLinearScale,
  PointElement, LineElement, Filler, Title, Tooltip, Legend
);

const gradeColors: Record<string, string> = {
  "5": "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400",
  "4": "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400",
  "3": "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400",
  "2": "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400",
};

interface GPAData {
  overallGPA: number;
  gpaLetter: string;
  totalCredits: number;
  semesterGPAs: { semester: string; gpa: number; gpaLetter: string; subjectCount: number }[];
}

interface PredictionData {
  prediction: {
    predictedScore: number;
    predictedGrade: string;
    confidence: string;
    recommendation: string;
  };
  scenarios: { targetGrade: string; targetScore: number; neededFinal: number }[];
  bestCase: { totalScore: number; gradeLetter: string };
  worstCase: { totalScore: number; gradeLetter: string };
}

interface Props { params: Promise<{ id: string }> }

export default function StudentProfilePage({ params }: Props) {
  const { id } = use(params);
  const [student, setStudent] = useState<StudentDTO | null>(null);
  const [gpa, setGpa] = useState<GPAData | null>(null);
  const [prediction, setPrediction] = useState<PredictionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      apiFetch<StudentDTO>(`/api/students/${id}`),
      apiFetch<GPAData>(`/api/students/${id}/gpa`),
    ])
      .then(([s, g]) => {
        setStudent(s);
        setGpa(g);
        if (s.grades && s.grades.length > 0) {
          const avg = (field: "attendance" | "homework" | "midterm") =>
            Math.round(s.grades!.reduce((a, b) => a + b[field], 0) / s.grades!.length);
          apiFetch<PredictionData>("/api/predict", {
            method: "POST",
            body: JSON.stringify({ attendance: avg("attendance"), homework: avg("homework"), midterm: avg("midterm") }),
          }).then(setPrediction).catch(() => {});
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const exportPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;
    if (!student) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Talaba hisoboti: ${student.user.name}`, 14, 20);
    doc.setFontSize(11);
    doc.text(`Guruh: ${student.group} | O'rtacha: ${student.averageScore}% | GPA: ${gpa?.overallGPA ?? "N/A"}`, 14, 30);
    autoTable(doc, {
      startY: 40,
      head: [["Fan", "Davomat", "Uy vazifasi", "Oraliq", "Final", "Jami", "Baho"]],
      body: (student.grades ?? []).map(g => [
        g.subject.name, g.attendance, g.homework, g.midterm, g.final, g.totalScore, g.gradeLetter,
      ]),
    });
    doc.save(`${student.user.name.replace(/\s+/g, "_")}_hisobot.pdf`);
  };

  if (loading) return <div className="flex h-full items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  if (error || !student) return <div className="p-6 text-red-500">{error || "Talaba topilmadi"}</div>;

  const grades = student.grades ?? [];

  const barData = {
    labels: grades.map(g => g.subject.name),
    datasets: [
      { label: "Davomat",     data: grades.map(g => g.attendance), backgroundColor: "rgba(99,102,241,0.7)",  borderRadius: 4 },
      { label: "Uy vazifasi", data: grades.map(g => g.homework),   backgroundColor: "rgba(59,130,246,0.7)",  borderRadius: 4 },
      { label: "Oraliq",      data: grades.map(g => g.midterm),    backgroundColor: "rgba(245,158,11,0.7)",  borderRadius: 4 },
      { label: "Final",       data: grades.map(g => g.final),      backgroundColor: "rgba(34,197,94,0.7)",   borderRadius: 4 },
    ],
  };

  const radarSubject = grades[0];
  const radarData = radarSubject ? {
    labels: ["Davomat", "Uy vazifasi", "Oraliq", "Final", "Jami"],
    datasets: [{
      label: radarSubject.subject.name,
      data: [radarSubject.attendance, radarSubject.homework, radarSubject.midterm, radarSubject.final, radarSubject.totalScore],
      backgroundColor: "rgba(59,130,246,0.2)",
      borderColor: "rgba(59,130,246,0.8)",
      pointBackgroundColor: "rgba(59,130,246,1)",
    }],
  } : null;

  const gpaLineData = gpa && gpa.semesterGPAs.length > 1 ? {
    labels: gpa.semesterGPAs.map(s => s.semester),
    datasets: [{
      label: "GPA",
      data: gpa.semesterGPAs.map(s => s.gpa),
      borderColor: "rgba(59,130,246,0.8)",
      backgroundColor: "rgba(59,130,246,0.1)",
      fill: true,
      tension: 0.4,
    }],
  } : null;

  return (
    <div>
      <TopBar title="Talaba Profili" />
      <div className="p-6 space-y-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/students"><ArrowLeft className="h-4 w-4 mr-1" />Orqaga</Link>
        </Button>

        {/* Sarlavha */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white text-2xl font-bold">
            {student.user.name[0]}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold">{student.user.name}</h2>
            <p className="text-muted-foreground">{student.user.email}</p>
            <div className="mt-1 flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{student.group}</Badge>
              {student.isAtRisk
                ? <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Xavf ostida</Badge>
                : <Badge variant="success"><TrendingUp className="h-3 w-3 mr-1" />Yaxshi holat</Badge>}
            </div>
          </div>
          {/* KPI ko'rsatkichlari */}
          <div className="flex gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-blue-600">{student.averageScore ?? 0}%</p>
              <p className="text-xs text-muted-foreground">O&apos;rt. ball</p>
            </div>
            {gpa && (
              <div>
                <p className="text-3xl font-bold text-purple-600">{gpa.overallGPA}</p>
                <p className="text-xs text-muted-foreground">GPA ({gpa.gpaLetter})</p>
              </div>
            )}
            {gpa && (
              <div>
                <p className="text-3xl font-bold text-green-600">{gpa.totalCredits}</p>
                <p className="text-xs text-muted-foreground">Kreditlar</p>
              </div>
            )}
          </div>
          <Button onClick={exportPDF} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />PDF Hisobot
          </Button>
        </div>

        {/* AI bashorati */}
        {prediction && (
          <Card className="border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
                <Brain className="h-5 w-5" />
                AI Natija Bashorati
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 rounded-lg bg-white dark:bg-gray-800 border">
                  <p className="text-3xl font-bold text-purple-600">{prediction.prediction.predictedScore}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Bashorat qilingan ball</p>
                  <Badge variant="secondary" className="mt-2">{prediction.prediction.predictedGrade}</Badge>
                </div>
                {prediction.scenarios.slice(0, 3).map(s => (
                  <div key={s.targetGrade} className="text-center p-4 rounded-lg bg-white dark:bg-gray-800 border">
                    <p className="text-sm font-medium text-muted-foreground mb-1">{s.targetGrade} olish uchun</p>
                    <p className="text-2xl font-bold">{s.neededFinal > 100 ? "N/A" : `${s.neededFinal}%`}</p>
                    <p className="text-xs text-muted-foreground mt-1">finalda zarur</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-start gap-2">
                <Star className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{prediction.prediction.recommendation}</p>
              </div>
              <div className="mt-2 flex gap-4 text-xs text-muted-foreground">
                <span>Eng yaxshi holat: <strong>{prediction.bestCase.totalScore}% ({prediction.bestCase.gradeLetter})</strong></span>
                <span>Eng yomon holat: <strong>{prediction.worstCase.totalScore}% ({prediction.worstCase.gradeLetter})</strong></span>
                <span>Ishonch: <strong>{prediction.prediction.confidence}</strong></span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Grafiklar */}
        {grades.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><BookOpen className="h-5 w-5" />Ball Tafsiloti</CardTitle></CardHeader>
              <CardContent>
                <Bar data={barData} options={{ responsive: true, scales: { y: { beginAtZero: true, max: 100 } }, plugins: { legend: { position: "bottom" } } }} />
              </CardContent>
            </Card>

            {radarData && (
              <Card>
                <CardHeader><CardTitle>Radar — {radarSubject.subject.name}</CardTitle></CardHeader>
                <CardContent className="flex justify-center">
                  <div className="w-72 h-72">
                    <Radar data={radarData} options={{ responsive: true, scales: { r: { beginAtZero: true, max: 100 } } }} />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <Card><CardContent className="py-12 text-center text-muted-foreground">Baholar yo&apos;q.</CardContent></Card>
        )}

        {/* GPA trendi */}
        {gpaLineData && (
          <Card>
            <CardHeader><CardTitle>Semestr Bo&apos;yicha GPA Trendi</CardTitle></CardHeader>
            <CardContent>
              <Line data={gpaLineData} options={{ responsive: true, scales: { y: { min: 0, max: 4, title: { display: true, text: "GPA" } } }, plugins: { legend: { display: false } } }} />
            </CardContent>
          </Card>
        )}

        {/* Fan baholari jadvali */}
        {grades.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Fan Baholari</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fan</TableHead>
                    <TableHead className="text-center">Dav</TableHead>
                    <TableHead className="text-center">UY</TableHead>
                    <TableHead className="text-center">Ora</TableHead>
                    <TableHead className="text-center">Final</TableHead>
                    <TableHead className="text-center">Jami</TableHead>
                    <TableHead className="text-center">Baho</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {grades.map(grade => (
                    <TableRow key={grade.id}>
                      <TableCell className="font-medium">{grade.subject.name}</TableCell>
                      <TableCell className="text-center">{grade.attendance}</TableCell>
                      <TableCell className="text-center">{grade.homework}</TableCell>
                      <TableCell className="text-center">{grade.midterm}</TableCell>
                      <TableCell className="text-center">{grade.final}</TableCell>
                      <TableCell className="text-center font-bold">{grade.totalScore}</TableCell>
                      <TableCell className="text-center">
                        <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${gradeColors[grade.gradeLetter]}`}>
                          {grade.gradeLetter}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
