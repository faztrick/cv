FROM node:20-slim AS deps

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci


FROM node:20-slim AS build

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json next.config.* tsconfig.json ./
COPY public ./public
COPY postcss.config.mjs eslint.config.mjs ./
COPY src ./src

# NEXT_PUBLIC_API_URL is baked into client bundles. Supply it at build time for Cloud Run.
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build


FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

COPY --from=build /app/package.json ./package.json

# Install production deps only
COPY package-lock.json ./package-lock.json
RUN npm ci --omit=dev

COPY --from=build /app/public ./public
COPY --from=build /app/.next ./.next
COPY --from=build /app/next.config.* ./

EXPOSE 8080

CMD ["npm", "run", "start"]
