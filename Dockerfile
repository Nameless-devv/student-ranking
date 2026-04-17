FROM node:22.12-slim
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate && npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "npx prisma db push && npm start"]
