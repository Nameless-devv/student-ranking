"use client";

import { useEffect, useState } from "react";
import {
  Users,
  TrendingUp,
  AlertTriangle,
  Award,
  BookOpen,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar, Doughnut } from "react-chartjs-2";
import TopBar from "@/components/layout/TopBar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/hooks/useApi";
import type { AnalyticsData } from "@/types";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<AnalyticsData>("/api/analytics")
      .then(setAnalytics)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="p-6 text-red-500">Tahlilni yuklashda xatolik: {error}</div>
    );
  }

  const gradeChartData = {
    labels: ["5 — A'lo (86-100)", "4 — Yaxshi (71-85)", "3 — Qoniqarli (56-70)", "2 — Qoniqarsiz (<56)"],
    datasets: [
      {
        data: [
          analytics.gradeDistribution["5"],
          analytics.gradeDistribution["4"],
          analytics.gradeDistribution["3"],
          analytics.gradeDistribution["2"],
        ],
        backgroundColor: ["#22c55e", "#3b82f6", "#f59e0b", "#f97316", "#ef4444"],
        borderWidth: 0,
      },
    ],
  };

  const subjectChartData = {
    labels: analytics.subjectPerformance.map((s) => s.subjectName),
    datasets: [
      {
        label: "O'rtacha ball",
        data: analytics.subjectPerformance.map((s) => s.averageScore),
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderRadius: 6,
      },
    ],
  };

  const statsCards = [
    {
      label: "Jami talabalar",
      value: analytics.totalStudents,
      icon: Users,
      color: "text-blue-600",
      bg: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      label: "O'rtacha ball",
      value: `${analytics.averageScore}%`,
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50 dark:bg-green-900/20",
    },
    {
      label: "Xavf ostidagi talabalar",
      value: analytics.atRiskStudents.length,
      icon: AlertTriangle,
      color: "text-red-600",
      bg: "bg-red-50 dark:bg-red-900/20",
    },
    {
      label: "Kuzatilayotgan fanlar",
      value: analytics.subjectPerformance.length,
      icon: BookOpen,
      color: "text-purple-600",
      bg: "bg-purple-50 dark:bg-purple-900/20",
    },
  ];

  return (
    <div>
      <TopBar title="Bosh sahifa" />
      <div className="p-6 space-y-6">
        {/* Statistika kartalari */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statsCards.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 pt-6">
                <div className={`rounded-full p-3 ${stat.bg}`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Eng yaxshi talabalar */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Eng Yaxshi Talabalar
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {analytics.topStudents.length === 0 ? (
                <p className="text-sm text-muted-foreground">Ma&apos;lumot yo&apos;q</p>
              ) : (
                analytics.topStudents.map((s, i) => (
                  <div key={s.id} className="flex items-center gap-3">
                    <span
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                        i === 0
                          ? "bg-yellow-500"
                          : i === 1
                          ? "bg-gray-400"
                          : i === 2
                          ? "bg-amber-700"
                          : "bg-blue-600"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{s.user.name}</p>
                      <p className="text-xs text-muted-foreground">{s.group}</p>
                    </div>
                    <Badge variant={s.averageScore >= 90 ? "success" : s.averageScore >= 70 ? "default" : "warning"}>
                      {s.averageScore}%
                    </Badge>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          {/* Baholar taqsimoti */}
          <Card>
            <CardHeader>
              <CardTitle>Baholar Taqsimoti</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <div className="w-64 h-64">
                <Doughnut
                  data={gradeChartData}
                  options={{
                    plugins: { legend: { position: "bottom" } },
                    cutout: "60%",
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Fan ko'rsatkichlari */}
        {analytics.subjectPerformance.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Fan Ko&apos;rsatkichlari</CardTitle>
            </CardHeader>
            <CardContent>
              <Bar
                data={subjectChartData}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                  scales: {
                    y: { beginAtZero: true, max: 100, title: { display: true, text: "O'rt. Ball" } },
                  },
                }}
              />
            </CardContent>
          </Card>
        )}

        {/* Xavf ostidagi talabalar */}
        {analytics.atRiskStudents.length > 0 && (
          <Card className="border-red-200 dark:border-red-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Xavf Ostidagi Talabalar ({analytics.atRiskStudents.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {analytics.atRiskStudents.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-3 rounded-lg border border-red-200 dark:border-red-800 p-3"
                  >
                    <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 font-bold text-sm">
                      {s.user.name[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{s.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        O&apos;rt: <span className="text-red-500 font-semibold">{s.averageScore}%</span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
