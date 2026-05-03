"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Kirish muvaffaqiyatsiz");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        {/* Sarlavha */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 mb-4 shadow-lg">
            <svg viewBox="0 0 32 32" fill="none" className="h-10 w-10" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="6" width="22" height="20" rx="2" fill="white" fillOpacity="0.15"/>
              <rect x="5" y="6" width="22" height="20" rx="2" stroke="white" strokeWidth="1.5"/>
              <line x1="16" y1="6" x2="16" y2="26" stroke="white" strokeWidth="1.2" strokeOpacity="0.5"/>
              <path d="M16 9 L17.2 12.6 L21 12.6 L18 14.8 L19.1 18.4 L16 16.2 L12.9 18.4 L14 14.8 L11 12.6 L14.8 12.6 Z"
                fill="white"/>
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            EduRanking
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Ta&apos;limiy Ko&apos;rsatkichlar Baholash Tizimi
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Kirish</CardTitle>
            <CardDescription>Hisobingizga kirish uchun ma&apos;lumotlarni kiriting</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-md bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 p-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Elektron pochta</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@school.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Parol</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Kirilmoqda…" : "Kirish"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              <span className="text-muted-foreground">Hisobingiz yo&apos;qmi?</span>{" "}
              <Link href="/register" className="text-blue-600 hover:underline font-medium">
                Ro&apos;yxatdan o&apos;tish
              </Link>
            </div>

            {/* Demo ma'lumotlar */}
            <div className="mt-4 rounded-md bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 text-xs text-blue-700 dark:text-blue-400">
              <strong>Demo:</strong> Namunaviy ma&apos;lumotlarni to&apos;ldirish uchun <code>npm run db:seed</code> ni ishga tushiring,
              keyin <code>admin@school.edu</code> / <code>admin123</code> orqali kiring
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
