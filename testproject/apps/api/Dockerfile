FROM node:20-slim AS deps

WORKDIR /app

# Install deps first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci


FROM node:20-slim AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client and build TS -> dist/
RUN npx prisma generate
RUN npm run build


FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production

# Cloud Run sets $PORT; the app reads it.
ENV PORT=8080

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma

EXPOSE 8080

CMD ["node", "dist/index.js"]
