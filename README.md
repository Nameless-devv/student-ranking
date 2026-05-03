# Talabalar Reytingi Tizimi

Ta'limiy ko'rsatkichlarni avtomatik hisoblash, tahlil qilish va reyting ko'rsatish platformasi.

## Loyiha maqsadi

O'quv muassasalarida talabalar baholarini raqamli boshqarish:

- **Admin / O'qituvchi** — talabalar, baholar va semestrlarni boshqaradi
- **Talaba** — o'z baholarini, GPA va reytingini ko'radi
- **Avtomatik hisob** — 4 komponent bo'yicha umumiy ball hisoblanadi
- **AI bashorat** — final imtihonga kerakli ball aniqlanadi
- **Xavf tahlili** — past ko'rsatkichli talabalar avtomatik belgilanadi

---

## Baholash tizimi

| Komponent | Max ball |
|-----------|----------|
| Davomat | 10 |
| Uy vazifasi | 20 |
| Oraliq imtihon | 30 |
| Final imtihon | 40 |
| **Jami** | **100** |

| Umumiy ball | Baho |
|-------------|------|
| 86 – 100 | **5** — A'lo |
| 71 – 85 | **4** — Yaxshi |
| 56 – 70 | **3** — Qoniqarli |
| 0 – 55 | **2** — Qoniqarsiz (xavf ostida) |

---

## Texnologiyalar

| Qatlam | Texnologiya |
|--------|-------------|
| Frontend | Next.js 16, TypeScript, Tailwind CSS v4 |
| Grafiklar | Chart.js, react-chartjs-2 |
| Backend | Next.js API Routes |
| ORM | Prisma 7 + PrismaPg adapter |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken + bcryptjs) |

---

## O'rnatish

### Talablar
- Node.js 22.12+
- PostgreSQL 14+

### 1. Yuklab olish

```bash
git clone https://github.com/Nameless-devv/student-ranking.git
cd student-ranking
npm install
```

### 2. Muhit o'zgaruvchilari

`.env` faylini yarating:

```env
DATABASE_URL=postgresql://USER:PAROL@localhost:5432/student_ranking
JWT_SECRET=uzun_va_murakkab_kalit_bu_yerni_ozgartiring
JWT_EXPIRES_IN=7d
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Bazani sozlash

```bash
npx prisma db push   # Jadvallarni yaratish
npm run db:seed      # Namunaviy ma'lumotlarni yuklash
```

### 4. Ishga tushirish

```bash
npm run dev
```

Brauzerda: `http://localhost:3000`

---

## Testlash

### Demo hisoblar

| Rol | Email | Parol |
|-----|-------|-------|
| Admin | admin@school.edu | admin123 |
| O'qituvchi | teacher@school.edu | teacher123 |
| Talaba | aziz@school.edu | student123 |

### Sahifalar bo'yicha tekshirish

| Sahifa | URL | Nima tekshiriladi |
|--------|-----|-------------------|
| Login | `/login` | Kirish, xato parol |
| Dashboard | `/dashboard` | Statistika, grafiklar, xavf ostidagilar |
| Talabalar | `/students` | Ro'yxat, qidiruv, guruh filtri |
| Talaba profili | `/students/:id` | Grafiklar, GPA, AI bashorat, PDF yuklash |
| Baho qo'shish | `/grades/new` | Ball kiritish, jonli hisoblash |
| Reyting | `/leaderboard` | Tartiblangan ro'yxat |
| Tahlil | `/analytics` | Grafiklar, eksport |
| Semestrlar | `/semesters` | Yaratish, faollashtirish |

### API testlash

```bash
# 1. Token olish
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.edu","password":"admin123"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# 2. Talabalar ro'yxati
curl http://localhost:3000/api/students \
  -H "Authorization: Bearer $TOKEN"

# 3. Tahlil
curl http://localhost:3000/api/analytics \
  -H "Authorization: Bearer $TOKEN"

# 4. Baho qo'shish
curl -X POST http://localhost:3000/api/grades \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "TALABA_ID",
    "subjectId": "FAN_ID",
    "attendance": 9,
    "homework": 17,
    "midterm": 25,
    "final": 36
  }'
```

### Eksport testlash

```
/api/export?type=students&format=xlsx    — Talabalar (Excel)
/api/export?type=students&format=csv     — Talabalar (CSV)
/api/export?type=grades&format=xlsx      — Baholar (Excel)
/api/export?type=leaderboard&format=xlsx — Reyting (Excel)
```

---

## Foydalanuvchi rollari

| Funksiya | Admin | O'qituvchi | Talaba |
|----------|-------|------------|--------|
| Dashboard va reyting | ✓ | ✓ | ✓ |
| Talabalar ro'yxati | ✓ | ✓ | — |
| Baho qo'shish/tahrirlash | ✓ | ✓ | — |
| Tahlil va eksport | ✓ | ✓ | — |
| Talaba o'chirish | ✓ | — | — |
| Audit jurnali | ✓ | — | — |

---

## API endpointlari

| Metod | Yo'l | Auth | Tavsif |
|-------|------|------|--------|
| POST | `/api/auth/register` | — | Hisob yaratish |
| POST | `/api/auth/login` | — | JWT token olish |
| GET | `/api/students` | Kerak | Talabalar ro'yxati |
| GET | `/api/students/:id` | Kerak | Talaba profili |
| GET | `/api/students/:id/gpa` | Kerak | GPA hisoblash |
| POST | `/api/grades` | Admin/Teacher | Baho qo'shish |
| GET | `/api/analytics` | Kerak | Umumiy statistika |
| GET | `/api/leaderboard` | Kerak | Reyting |
| POST | `/api/predict` | Kerak | AI bashorat |
| GET | `/api/export` | Kerak | Excel/CSV eksport |
| GET | `/api/semesters` | Kerak | Semestrlar |
| GET | `/api/subjects` | Kerak | Fanlar |

---

## Deploy (Render)

1. [render.com](https://render.com) → **New Web Service** → GitHub repo ulash
2. **Environment:** Docker
3. **PostgreSQL** servis yarating
4. Environment variables:
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=...
   NODE_ENV=production
   NEXT_PUBLIC_APP_URL=https://sizning-app.onrender.com
   ```
5. Deploy tugagach seed (tashqi URL bilan):
   ```bash
   DATABASE_URL="postgresql://...external..." npm run db:seed
   ```

---

## Loyiha tuzilmasi

```
src/
├── app/
│   ├── (auth)/           # Login, ro'yxatdan o'tish
│   ├── (dashboard)/      # Asosiy sahifalar
│   │   ├── dashboard/
│   │   ├── students/
│   │   ├── grades/new/
│   │   ├── leaderboard/
│   │   ├── analytics/
│   │   ├── semesters/
│   │   ├── notifications/
│   │   └── audit-logs/
│   └── api/              # Backend API route'lari
├── components/           # UI komponentlar
├── lib/                  # Prisma, auth, email, audit
├── utils/                # Baholash logikasi (grading.ts)
└── types/                # TypeScript turlar
```
