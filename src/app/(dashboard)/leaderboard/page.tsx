"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Trophy, Medal, Download } from "lucide-react";
import TopBar from "@/components/layout/TopBar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/hooks/useApi";
import type { LeaderboardEntry } from "@/types";

function rankIcon(rank: number) {
  if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
}

function scoreColor(score: number) {
  if (score >= 90) return "text-green-600 dark:text-green-400";
  if (score >= 80) return "text-blue-600 dark:text-blue-400";
  if (score >= 70) return "text-yellow-600 dark:text-yellow-400";
  if (score >= 60) return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [searchName, setSearchName] = useState("");

  useEffect(() => {
    const params = new URLSearchParams({ limit: "100" });
    if (groupFilter) params.set("group", groupFilter);
    apiFetch<LeaderboardEntry[]>(`/api/leaderboard?${params}`)
      .then(setEntries)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [groupFilter]);

  const groups = [...new Set(entries.map((e) => e.group))].sort();
  const filtered = entries.filter((e) =>
    e.user.name.toLowerCase().includes(searchName.toLowerCase())
  );

  const top3 = filtered.slice(0, 3);

  return (
    <div>
      <TopBar title="Reyting" />
      <div className="p-6 space-y-6">
        {/* Top 3 podyum */}
        {!loading && filtered.length >= 3 && (
          <div className="grid grid-cols-3 gap-4">
            {/* 2-o'rin */}
            <Card className="mt-6 border-gray-300 dark:border-gray-600">
              <CardContent className="flex flex-col items-center pt-6 pb-4 text-center">
                <Medal className="h-8 w-8 text-gray-400 mb-2" />
                <div className="h-12 w-12 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-lg font-bold mb-2">
                  {top3[1]?.user.name[0]}
                </div>
                <p className="font-semibold text-sm truncate w-full">{top3[1]?.user.name}</p>
                <p className="text-xs text-muted-foreground">{top3[1]?.group}</p>
                <p className={`text-xl font-bold mt-1 ${scoreColor(top3[1]?.averageScore ?? 0)}`}>
                  {top3[1]?.averageScore}%
                </p>
              </CardContent>
            </Card>

            {/* 1-o'rin */}
            <Card className="border-yellow-400 dark:border-yellow-600 shadow-lg ring-2 ring-yellow-300">
              <CardContent className="flex flex-col items-center pt-6 pb-4 text-center">
                <Trophy className="h-10 w-10 text-yellow-500 mb-2" />
                <div className="h-14 w-14 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center text-xl font-bold mb-2 text-yellow-700 dark:text-yellow-400">
                  {top3[0]?.user.name[0]}
                </div>
                <p className="font-bold truncate w-full">{top3[0]?.user.name}</p>
                <p className="text-xs text-muted-foreground">{top3[0]?.group}</p>
                <p className={`text-2xl font-bold mt-1 ${scoreColor(top3[0]?.averageScore ?? 0)}`}>
                  {top3[0]?.averageScore}%
                </p>
              </CardContent>
            </Card>

            {/* 3-o'rin */}
            <Card className="mt-6 border-amber-600 dark:border-amber-700">
              <CardContent className="flex flex-col items-center pt-6 pb-4 text-center">
                <Medal className="h-8 w-8 text-amber-600 mb-2" />
                <div className="h-12 w-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center text-lg font-bold mb-2 text-amber-700">
                  {top3[2]?.user.name[0]}
                </div>
                <p className="font-semibold text-sm truncate w-full">{top3[2]?.user.name}</p>
                <p className="text-xs text-muted-foreground">{top3[2]?.group}</p>
                <p className={`text-xl font-bold mt-1 ${scoreColor(top3[2]?.averageScore ?? 0)}`}>
                  {top3[2]?.averageScore}%
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Eksport */}
        <div className="flex gap-2 justify-end">
          {["xlsx","csv"].map(fmt => (
            <Button key={fmt} variant="outline" size="sm" asChild>
              <a href={`/api/export?type=leaderboard&format=${fmt}`} download>
                <Download className="h-3 w-3 mr-1"/>{fmt.toUpperCase()}
              </a>
            </Button>
          ))}
        </div>

        {/* Filtrlar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Ism bo'yicha qidiring…"
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            className="sm:w-64"
          />
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setGroupFilter("")}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                groupFilter === "" ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              Barcha guruhlar
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
          </div>
        </div>

        {/* To'liq reyting jadvali */}
        <Card>
          <CardHeader>
            <CardTitle>To&apos;liq Reyting</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="h-6 w-6 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : error ? (
              <p className="text-center py-8 text-red-500">{error}</p>
            ) : filtered.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">Talabalar topilmadi</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">O&apos;rin</TableHead>
                    <TableHead>Talaba</TableHead>
                    <TableHead>Guruh</TableHead>
                    <TableHead className="text-right">O&apos;rtacha ball</TableHead>
                    <TableHead className="text-center">Holat</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((entry) => (
                    <TableRow
                      key={entry.id}
                      className={entry.rank <= 3 ? "bg-yellow-50/50 dark:bg-yellow-900/10" : ""}
                    >
                      <TableCell>
                        <div className="flex items-center justify-center w-8">
                          {rankIcon(entry.rank)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-sm font-bold text-blue-700 dark:text-blue-400">
                            {entry.user.name[0]}
                          </div>
                          <span className="font-medium">{entry.user.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{entry.group}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={`text-lg font-bold ${scoreColor(entry.averageScore)}`}>
                          {entry.averageScore}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {entry.isAtRisk ? (
                          <Badge variant="destructive">Xavf ostida</Badge>
                        ) : (
                          <Badge variant="success">Yaxshi</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button asChild size="sm" variant="ghost">
                          <Link href={`/students/${entry.id}`}>Profil</Link>
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
