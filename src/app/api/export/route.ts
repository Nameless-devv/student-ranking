import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { writeAudit } from "@/lib/audit";
import * as XLSX from "xlsx";

export async function GET(req: NextRequest) {
  try {
    const user = requireAuth(req);
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "xlsx"; // xlsx | csv | json
    const type = searchParams.get("type") || "students"; // students | grades | leaderboard

    let data: Record<string, unknown>[] = [];

    if (type === "students") {
      const students = await prisma.student.findMany({
        include: {
          user: { select: { name: true, email: true } },
          grades: { include: { subject: { select: { name: true } } } },
        },
        orderBy: { user: { name: "asc" } },
      });

      data = students.map((s) => {
        const scores = s.grades.map((g) => g.totalScore);
        const avg = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0;
        return {
          Name: s.user.name,
          Email: s.user.email,
          Group: s.group,
          "Average Score": avg,
          Status: avg < 60 ? "At Risk" : "Good",
          Subjects: s.grades.length,
        };
      });
    } else if (type === "grades") {
      const grades = await prisma.grade.findMany({
        include: {
          student: { include: { user: { select: { name: true, email: true } } } },
          subject: { select: { name: true } },
          semester: { select: { name: true } },
        },
        orderBy: [{ student: { user: { name: "asc" } } }, { subject: { name: "asc" } }],
      });

      data = grades.map((g) => ({
        Student: g.student.user.name,
        Email: g.student.user.email,
        Group: g.student.group,
        Subject: g.subject.name,
        Semester: g.semester?.name || "N/A",
        Attendance: g.attendance,
        Homework: g.homework,
        Midterm: g.midterm,
        Final: g.final,
        "Total Score": g.totalScore,
        Grade: g.gradeLetter,
      }));
    } else if (type === "leaderboard") {
      const students = await prisma.student.findMany({
        include: {
          user: { select: { name: true, email: true } },
          grades: { select: { totalScore: true, gradeLetter: true } },
        },
      });

      const ranked = students
        .map((s) => {
          const scores = s.grades.map((g) => g.totalScore);
          const avg = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : 0;
          return { ...s, avg };
        })
        .sort((a, b) => b.avg - a.avg);

      data = ranked.map((s, i) => ({
        Rank: i + 1,
        Name: s.user.name,
        Email: s.user.email,
        Group: s.group,
        "Average Score": s.avg,
        Status: s.avg < 60 ? "At Risk" : "Good",
      }));
    }

    await writeAudit({
      userId: user.userId,
      action: "EXPORT",
      entity: type,
      details: { format, count: data.length },
    });

    if (format === "json") {
      return Response.json(data);
    }

    // Build Excel / CSV with SheetJS
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, type.charAt(0).toUpperCase() + type.slice(1));

    const buf = XLSX.write(wb, {
      type: "buffer",
      bookType: format === "csv" ? "csv" : "xlsx",
    });

    const contentType =
      format === "csv"
        ? "text/csv"
        : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    const ext = format === "csv" ? "csv" : "xlsx";

    return new Response(buf, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${type}-${Date.now()}.${ext}"`,
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[GET /api/export]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
