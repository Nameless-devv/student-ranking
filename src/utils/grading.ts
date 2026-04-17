/**
 * Core grading logic.
 *
 * Formula:  totalScore = attendance(0-10) + homework(0-20) + midterm(0-30) + final(0-40)
 *
 * O'zbek baholash tizimi:
 *   86–100 → 5 (A'lo)
 *   71–85  → 4 (Yaxshi)
 *   56–70  → 3 (Qoniqarli)
 *   < 56   → 2 (Qoniqarsiz)
 */

export type GradeLetter = "5" | "4" | "3" | "2";

export interface ScoreInputs {
  attendance: number;
  homework: number;
  midterm: number;
  final: number;
}

export function calculateTotalScore(inputs: ScoreInputs): number {
  const { attendance, homework, midterm, final } = inputs;
  const score = attendance + homework + midterm + final;
  return Math.round(score * 100) / 100;
}

export function calculateGradeLetter(totalScore: number): GradeLetter {
  if (totalScore >= 86) return "5";
  if (totalScore >= 71) return "4";
  if (totalScore >= 56) return "3";
  return "2";
}

/** GPA ballari: 5→5.0, 4→4.0, 3→3.0, 2→2.0 */
export function gradeLetterToPoints(letter: GradeLetter): number {
  const map: Record<GradeLetter, number> = { "5": 5.0, "4": 4.0, "3": 3.0, "2": 2.0 };
  return map[letter] ?? 2.0;
}

/** totalScore, gradeLetter va gradePoints ni hisoblaydi. */
export function deriveGrade(inputs: ScoreInputs): {
  totalScore: number;
  gradeLetter: GradeLetter;
  gradePoints: number;
} {
  const totalScore = calculateTotalScore(inputs);
  const gradeLetter = calculateGradeLetter(totalScore);
  const gradePoints = gradeLetterToPoints(gradeLetter);
  return { totalScore, gradeLetter, gradePoints };
}

/**
 * O'rtacha GPA hisoblash (og'irlikli).
 * grades: { gradePoints, creditHours }[] massivi
 */
export function calculateGPA(
  grades: { gradePoints: number; creditHours: number }[]
): number {
  if (grades.length === 0) return 0;
  const totalPoints = grades.reduce((s, g) => s + g.gradePoints * g.creditHours, 0);
  const totalCredits = grades.reduce((s, g) => s + g.creditHours, 0);
  if (totalCredits === 0) return 0;
  return Math.round((totalPoints / totalCredits) * 100) / 100;
}

/** GPA → baho harfi (5.0 shkala) */
export function gpaToLetter(gpa: number): string {
  if (gpa >= 4.5) return "5";
  if (gpa >= 3.5) return "4";
  if (gpa >= 2.5) return "3";
  return "2";
}

/** Talaba "xavf ostida" bo'lsa true (totalScore < 56). */
export function isAtRisk(totalScore: number): boolean {
  return totalScore < 56;
}

/** Xavf darajasi yorlig'i. */
export function riskLabel(totalScore: number): string {
  if (totalScore >= 86) return "A'lo";
  if (totalScore >= 71) return "Yaxshi";
  if (totalScore >= 56) return "Qoniqarli";
  return "Xavf ostida";
}

/**
 * Maqsad bahoga erishish uchun zarur final ball.
 */
export function predictNeededFinal(
  current: Omit<ScoreInputs, "final">,
  targetTotal: number
): number {
  const needed = targetTotal - current.attendance - current.homework - current.midterm;
  return Math.max(0, Math.min(40, Math.round(needed * 100) / 100));
}

/**
 * AI natija bashorati.
 */
export function predictPerformance(inputs: Omit<ScoreInputs, "final">): {
  predictedScore: number;
  predictedGrade: GradeLetter;
  confidence: "high" | "medium" | "low";
  recommendation: string;
} {
  const { attendance, homework, midterm } = inputs;

  const partial = attendance + homework + midterm;
  const estimatedFinal = Math.min(40, Math.round(midterm * (40 / 30) * 1.05 * 100) / 100);
  const predictedScore = Math.round((partial + estimatedFinal) * 100) / 100;
  const predictedGrade = calculateGradeLetter(predictedScore);

  const avg = (attendance + homework + midterm) / 3;
  const variance = ((attendance - avg) ** 2 + (homework - avg) ** 2 + (midterm - avg) ** 2) / 3;
  const confidence: "high" | "medium" | "low" =
    variance < 100 ? "high" : variance < 300 ? "medium" : "low";

  let recommendation = "";
  if (attendance < 7) recommendation += "Darsga qatnashishni oshiring. ";
  if (homework < 12) recommendation += "Uy vazifalarini bajarishga ko'proq vaqt ajrating. ";
  if (midterm < 18) recommendation += "O'qituvchidan qo'shimcha yordam so'rang. ";
  if (predictedScore >= 86) recommendation = "Zo'r natija! Shunday davom eting.";
  if (!recommendation) recommendation = "O'rtacha ko'rsatkich, chuqurroq o'rganishga harakat qiling.";

  return { predictedScore, predictedGrade, confidence, recommendation };
}
