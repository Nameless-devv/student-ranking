import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

// GET /api/leaderboard — students ranked by average totalScore (desc)
export async function GET(req: NextRequest) {
  try {
    requireAuth(req);

    const { searchParams } = new URL(req.url);
    const group = searchParams.get("group") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 200);

    const students = await prisma.student.findMany({
      where: group ? { group } : {},
      include: {
        user: { select: { id: true, name: true, email: true } },
        grades: { select: { totalScore: true, gradeLetter: true, subject: { select: { name: true } } } },
      },
    });

    // Rank by average total score (only students with at least one grade)
    const ranked = students
      .map((s) => {
        const scores = s.grades.map((g) => g.totalScore);
        const averageScore =
          scores.length > 0
            ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
            : 0;
        return { ...s, averageScore, isAtRisk: averageScore < 60 };
      })
      .sort((a, b) => b.averageScore - a.averageScore)
      .slice(0, limit)
      .map((s, idx) => ({ ...s, rank: idx + 1 }));

    return Response.json(ranked);
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[GET /api/leaderboard]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
