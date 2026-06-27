FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm ci --no-audit --no-fund

COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts

RUN npx prisma generate

COPY src ./src

EXPOSE 3000

CMD ["node", "src/server.js"]
