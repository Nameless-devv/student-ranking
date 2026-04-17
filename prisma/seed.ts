/**
 * Seed script — populates the database with realistic sample data.
 * Run with: npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
 * Or via:   npm run db:seed
 */

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import { deriveGrade } from "../src/utils/grading";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

const subjects = [
  "Matematika",
  "Dasturlash asoslari",
  "Axborot texnologiyalari",
  "Fizika",
  "Ingliz tili",
];

const students: {
  name: string;
  email: string;
  group: string;
}[] = [
  { name: "Aziz Karimov",       email: "aziz@school.edu",      group: "DI" },
  { name: "Dilnoza Yusupova",   email: "dilnoza@school.edu",   group: "DI" },
  { name: "Sardor Toshmatov",   email: "sardor@school.edu",    group: "DI" },
  { name: "Malika Rahimova",    email: "malika@school.edu",    group: "KI" },
  { name: "Jasur Xolmatov",     email: "jasur@school.edu",     group: "KI" },
  { name: "Nilufar Hasanova",   email: "nilufar@school.edu",   group: "AT" },
  { name: "Bobur Mirzayev",     email: "bobur@school.edu",     group: "AT" },
  { name: "Zulfiya Qodirova",   email: "zulfiya@school.edu",   group: "AX" },
  { name: "Ulugbek Normatov",   email: "ulugbek@school.edu",   group: "AX" },
  { name: "Shahnoza Ergasheva", email: "shahnoza@school.edu",  group: "AX" },
];

// Scores: attendance(0-10), homework(0-20), midterm(0-30), final(0-40) → total 100
const scores = [
  { attendance: 10, homework: 18, midterm: 26, final: 37 }, // Aziz     — 91 → 5
  { attendance:  8, homework: 15, midterm: 21, final: 31 }, // Dilnoza  — 75 → 4
  { attendance:  6, homework: 10, midterm: 15, final: 21 }, // Sardor   — 52 → 2 (xavf)
  { attendance: 10, homework: 19, midterm: 29, final: 39 }, // Malika   — 97 → 5
  { attendance:  7, homework: 14, midterm: 23, final: 32 }, // Jasur    — 76 → 4
  { attendance:  6, homework: 12, midterm: 17, final: 26 }, // Nilufar  — 61 → 3
  { attendance:  9, homework: 17, midterm: 26, final: 36 }, // Bobur    — 88 → 5
  { attendance:  8, homework: 16, midterm: 22, final: 30 }, // Zulfiya  — 76 → 4
  { attendance:  9, homework: 18, midterm: 27, final: 38 }, // Ulugbek  — 92 → 5
  { attendance:  4, homework:  7, midterm: 13, final: 15 }, // Shahnoza — 39 → 2 (xavf)
];

async function main() {
  console.log("🌱 Seeding database…");

  // ── Admin user ────────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "admin@school.edu" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@school.edu",
      password: await bcrypt.hash("admin123", 12),
      role: "ADMIN",
    },
  });

  // ── Teacher user ──────────────────────────────────────────────────────────
  await prisma.user.upsert({
    where: { email: "teacher@school.edu" },
    update: {},
    create: {
      name: "Prof. Smith",
      email: "teacher@school.edu",
      password: await bcrypt.hash("teacher123", 12),
      role: "TEACHER",
    },
  });

  // ── Subjects ──────────────────────────────────────────────────────────────
  const subjectRecords = await Promise.all(
    subjects.map((name) =>
      prisma.subject.upsert({
        where: { name },
        update: {},
        create: { name },
      })
    )
  );
  console.log(`✅ ${subjectRecords.length} subjects created`);

  // ── Students + Grades ─────────────────────────────────────────────────────
  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    const score = scores[i];

    // Create user + student
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: {
        name: s.name,
        email: s.email,
        password: await bcrypt.hash("student123", 12),
        role: "STUDENT",
      },
    });

    const student = await prisma.student.upsert({
      where: { userId: user.id },
      update: { group: s.group },
      create: { userId: user.id, group: s.group },
    });

    // Assign grades for each subject with slight variation
    for (let j = 0; j < subjectRecords.length; j++) {
      const v = j - 2; // -2, -1, 0, 1, 2
      const inputs = {
        attendance: Math.max(0, Math.min(10,  score.attendance + (v > 0 ? 1 : v < 0 ? -1 : 0))),
        homework:   Math.max(0, Math.min(20,  score.homework   - v)),
        midterm:    Math.max(0, Math.min(30,  score.midterm    + v)),
        final:      Math.max(0, Math.min(40,  score.final      - Math.round(v / 2))),
      };
      const { totalScore, gradeLetter, gradePoints } = deriveGrade(inputs);

      // semesterId is null — use findFirst+create/update instead of upsert
      const existing = await prisma.grade.findFirst({
        where: { studentId: student.id, subjectId: subjectRecords[j].id, semesterId: null },
      });
      if (existing) {
        await prisma.grade.update({
          where: { id: existing.id },
          data: { ...inputs, totalScore, gradeLetter, gradePoints },
        });
      } else {
        await prisma.grade.create({
          data: {
            studentId: student.id,
            subjectId: subjectRecords[j].id,
            ...inputs,
            totalScore,
            gradeLetter,
            gradePoints,
          },
        });
      }
    }

    console.log(`  ✅ ${s.name} (${s.group})`);
  }

  console.log("\n🎉 Seed complete!");
  console.log("   Admin:   admin@school.edu   / admin123");
  console.log("   Teacher: teacher@school.edu / teacher123");
  console.log("   Student: aziz@school.edu    / student123\n");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
