import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";

const subjectSchema = z.object({
  name: z.string().min(2, "Subject name must be at least 2 characters"),
});

// GET /api/subjects
export async function GET(req: NextRequest) {
  try {
    requireAuth(req);
    const subjects = await prisma.subject.findMany({ orderBy: { name: "asc" } });
    return Response.json(subjects);
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/subjects — admin/teacher only
export async function POST(req: NextRequest) {
  try {
    const user = requireAuth(req);
    if (!["ADMIN", "TEACHER"].includes(user.role)) {
      return Response.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = subjectSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
    }

    const subject = await prisma.subject.create({ data: { name: parsed.data.name } });
    return Response.json(subject, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[POST /api/subjects]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
