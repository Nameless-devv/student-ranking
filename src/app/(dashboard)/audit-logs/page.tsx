"use client";

import { useEffect, useState } from "react";
import { Shield, ChevronLeft, ChevronRight } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { apiFetch } from "@/hooks/useApi";

interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  ipAddress?: string;
  createdAt: string;
  user: { name: string; email: string; role: string };
}

interface Response {
  logs: AuditLog[];
  total: number;
  page: number;
  pages: number;
}

const actionColors: Record<string, string> = {
  CREATE: "success",
  UPDATE: "default",
  DELETE: "destructive",
  LOGIN: "secondary",
  EXPORT: "warning",
};

const actionLabels: Record<string, string> = {
  CREATE: "YARATISH",
  UPDATE: "YANGILASH",
  DELETE: "O'CHIRISH",
  LOGIN: "KIRISH",
  EXPORT: "EKSPORT",
};

const roleLabels: Record<string, string> = {
  ADMIN: "Administrator",
  TEACHER: "O'qituvchi",
  STUDENT: "Talaba",
};

export default function AuditLogsPage() {
  const [data, setData] = useState<Response | null>(null);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    apiFetch<Response>(`/api/audit-logs?page=${page}&limit=20`)
      .then(setData)
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <div>
      <TopBar title="Audit Jurnali" />
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-600" />
          <p className="text-sm text-muted-foreground">
            Barcha admin va o&apos;qituvchi amallari hisobdorlik uchun bu yerda qayd etiladi.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Faollik Jurnali {data && <span className="text-muted-foreground font-normal text-sm ml-2">({data.total} ta jami)</span>}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : !data || data.logs.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Jurnal yo&apos;q</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vaqt</TableHead>
                    <TableHead>Foydalanuvchi</TableHead>
                    <TableHead>Amal</TableHead>
                    <TableHead>Ob&apos;ekt</TableHead>
                    <TableHead>Tafsilotlar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.logs.map((log) => {
                    let details: Record<string, unknown> = {};
                    try { details = JSON.parse(log.details || "{}"); } catch {}
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString("uz-UZ")}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{log.user.name}</div>
                          <div className="text-xs text-muted-foreground">{roleLabels[log.user.role] ?? log.user.role}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={(actionColors[log.action] || "secondary") as "success" | "default" | "destructive" | "secondary" | "warning" | "outline"}>
                            {actionLabels[log.action] ?? log.action}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{log.entity}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                          {Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(", ")}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Sahifalash */}
        {data && data.pages > 1 && (
          <div className="flex items-center justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">Sahifa {page} / {data.pages}</span>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(data.pages, p + 1))} disabled={page === data.pages}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
