FROM node:20-slim AS base

# Prisma engines require OpenSSL at runtime (and sometimes at generate-time).
RUN apt-get update \
	&& apt-get install -y --no-install-recommends openssl ca-certificates \
	&& rm -rf /var/lib/apt/lists/*


FROM base AS deps

WORKDIR /app

# Install deps first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci


FROM base AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

# Generate Prisma client and build TS -> dist/
RUN npx prisma generate
RUN npm run build


FROM base AS runner

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
