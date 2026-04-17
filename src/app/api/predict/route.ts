import { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth";
import { predictPerformance, predictNeededFinal, deriveGrade } from "@/utils/grading";
import { z } from "zod";

const schema = z.object({
  attendance: z.number().min(0).max(100),
  homework: z.number().min(0).max(100),
  midterm: z.number().min(0).max(100),
});

export async function POST(req: NextRequest) {
  try {
    requireAuth(req);
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return Response.json({ error: "Validation failed" }, { status: 400 });

    const { attendance, homework, midterm } = parsed.data;
    const prediction = predictPerformance({ attendance, homework, midterm });

    // Simulate scenarios
    const scenarios = [
      { targetGrade: "A", targetScore: 90, neededFinal: predictNeededFinal({ attendance, homework, midterm }, 90) },
      { targetGrade: "B", targetScore: 80, neededFinal: predictNeededFinal({ attendance, homework, midterm }, 80) },
      { targetGrade: "C", targetScore: 70, neededFinal: predictNeededFinal({ attendance, homework, midterm }, 70) },
    ];

    // What-if: if final = 100
    const bestCase = deriveGrade({ attendance, homework, midterm, final: 100 });
    // What-if: if final = 0
    const worstCase = deriveGrade({ attendance, homework, midterm, final: 0 });

    return Response.json({
      prediction,
      scenarios,
      bestCase,
      worstCase,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[POST /api/predict]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
