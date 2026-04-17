"use client";

import { useEffect, useState } from "react";
import { Bell, Send, AlertTriangle, CheckCircle, Users } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/hooks/useApi";
import type { StudentDTO } from "@/types";

export default function NotificationsPage() {
  const [atRiskStudents, setAtRiskStudents] = useState<StudentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, string>>({});

  useEffect(() => {
    apiFetch<{ atRiskStudents: StudentDTO[] }>("/api/analytics")
      .then(d => setAtRiskStudents(d.atRiskStudents))
      .finally(() => setLoading(false));
  }, []);

  const sendAlert = async (type: string, studentId?: string) => {
    const key = studentId || "bulk";
    setSending(key);
    try {
      const res = await apiFetch<{ message: string; sent: number }>("/api/notifications", {
        method: "POST",
        body: JSON.stringify({ type, studentId }),
      });
      setResults(r => ({ ...r, [key]: `✅ ${res.message}` }));
    } catch (e: unknown) {
      setResults(r => ({ ...r, [key]: `❌ ${e instanceof Error ? e.message : "Xatolik"}` }));
    } finally {
      setSending(null);
    }
  };

  return (
    <div>
      <TopBar title="Bildirishnomalar" />
      <div className="p-6 space-y-6">
        {/* SMTP ma'lumot banneri */}
        <div className="rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-4 text-sm text-blue-700 dark:text-blue-300">
          <strong>Dev rejimi:</strong> Emaillar server konsolida ko&apos;rsatiladi.
          Haqiqiy emaillar yuborish uchun <code>.env</code> da <code>SMTP_ENABLED=true</code> va SMTP sozlamalarini kiriting.
        </div>

        {/* Ommaviy bildirishnoma */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-orange-500" />
              Ommaviy Bildirishnomalar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Barcha xavf ostidagi talabalar uchun barcha o&apos;qituvchilarga ogohlantiruv emaillar yuboring.
            </p>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => sendAlert("bulk-at-risk")}
                disabled={sending === "bulk"}
                variant="destructive"
              >
                <Send className="h-4 w-4 mr-2" />
                {sending === "bulk" ? "Yuborilmoqda…" : "Barcha O'qituvchilarga Xavf Ogohlantirishini Yuborish"}
              </Button>
              {results["bulk"] && (
                <span className="text-sm font-medium">{results["bulk"]}</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Har bir talaba uchun bildirishnoma */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Xavf Ostidagi Talabalar ({atRiskStudents.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : atRiskStudents.length === 0 ? (
              <div className="flex items-center gap-3 py-6 text-green-600">
                <CheckCircle className="h-6 w-6" />
                <span>Hozirda xavf ostidagi talabalar yo&apos;q. Ajoyib!</span>
              </div>
            ) : (
              <div className="space-y-3">
                {atRiskStudents.map(s => (
                  <div key={s.id} className="flex items-center gap-4 p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
                    <div className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 font-bold">
                      {s.user.name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{s.user.name}</p>
                      <p className="text-xs text-muted-foreground">{s.user.email} · {s.group}</p>
                    </div>
                    <Badge variant="destructive">{s.averageScore}%</Badge>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendAlert("at-risk-alert", s.id)}
                        disabled={sending === s.id}
                      >
                        <Bell className="h-3 w-3 mr-1" />
                        {sending === s.id ? "…" : "O'qituvchilarni Ogohlantirish"}
                      </Button>
                      {results[s.id] && (
                        <span className="text-xs text-green-600">{results[s.id]}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
