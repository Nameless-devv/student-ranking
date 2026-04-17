FROM node:22.12-slim
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
# Placeholder for build-time static analysis (overridden at runtime by Render env vars)
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build
RUN npx prisma generate && npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && npm start"]
