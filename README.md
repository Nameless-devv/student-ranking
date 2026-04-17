# Student Ranking Automation System

A production-ready web platform that automatically calculates, analyzes, and displays student rankings based on multiple academic metrics.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS v4, ShadCN-style UI |
| Charts | Chart.js + react-chartjs-2 |
| Backend | Next.js Route Handlers (API routes) |
| ORM | Prisma 7 |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken + bcryptjs) |

---

## Grading Formula

```
totalScore = 0.1 × attendance + 0.2 × homework + 0.3 × midterm + 0.4 × final
```

| Score Range | Grade |
|-------------|-------|
| 90 – 100    | A     |
| 80 – 89     | B     |
| 70 – 79     | C     |
| 60 – 69     | D     |
| < 60        | F     |

---

## Quick Start

### 1. Prerequisites

- Node.js >= 18
- PostgreSQL running locally

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment

Edit `.env`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/student_ranking?schema=public"
JWT_SECRET="change-me-in-production"
JWT_EXPIRES_IN="7d"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. Push schema to database

```bash
npm run db:push
```

### 5. Seed sample data

```bash
npm run db:seed
```

This creates:
- **Admin**: `admin@school.edu` / `admin123`
- **Teacher**: `teacher@school.edu` / `teacher123`
- **10 Students** in 3 groups with grades for 5 subjects (password: `student123`)

### 6. Run the dev server

```bash
npm run dev
```

Open http://localhost:3000

---

## Project Structure

```
student-ranking/
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Sample data
├── src/
│   ├── app/
│   │   ├── (auth)/         # Login / Register pages (public)
│   │   ├── (dashboard)/    # Protected dashboard pages
│   │   │   ├── dashboard/
│   │   │   ├── students/
│   │   │   ├── leaderboard/
│   │   │   ├── analytics/
│   │   │   └── grades/new/
│   │   └── api/            # Route Handlers
│   ├── components/
│   │   ├── ui/             # Reusable UI components
│   │   └── layout/         # Sidebar, TopBar, ProtectedRoute
│   ├── contexts/
│   │   └── AuthContext.tsx # JWT auth state
│   ├── hooks/
│   │   └── useApi.ts       # Fetch helper
│   ├── lib/
│   │   ├── prisma.ts
│   │   └── auth.ts
│   ├── types/
│   └── utils/
│       └── grading.ts      # Score formula
└── prisma.config.ts
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | — | Create account |
| POST | `/api/auth/login` | — | Get JWT token |
| GET | `/api/students` | Required | List students |
| POST | `/api/students` | Admin/Teacher | Create student |
| GET | `/api/students/:id` | Required | Student profile |
| GET | `/api/grades` | Required | List grades |
| POST | `/api/grades` | Admin/Teacher | Upsert grade (auto-calculates) |
| GET | `/api/subjects` | Required | List subjects |
| POST | `/api/subjects` | Admin/Teacher | Create subject |
| GET | `/api/leaderboard` | Required | Ranked students |
| GET | `/api/analytics` | Required | Aggregate stats |

---

## User Roles

| Feature | Admin | Teacher | Student |
|---------|-------|---------|---------|
| Dashboard & leaderboard | ✓ | ✓ | ✓ |
| Student list + profiles | ✓ | ✓ | — |
| Add/edit grades | ✓ | ✓ | — |
| Analytics | ✓ | ✓ | — |
| Delete students | ✓ | — | — |

---

## AI Feature: At-Risk Detection

Students whose average `totalScore` < 60 are automatically flagged as *at-risk* and shown on the Dashboard and Analytics pages.
