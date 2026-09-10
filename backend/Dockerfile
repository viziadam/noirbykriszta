# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
# openssl: a Prisma query engine-hez ·  tzdata: a magyar időzónához
RUN apk add --no-cache openssl tzdata
WORKDIR /app

# ---- Függőségek + Prisma kliens (teljes install, kell a prisma CLI) ----
FROM base AS build
COPY package.json package-lock.json* ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate

# ---- Futtató réteg ----
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=4000
# Alap időzóna — a docker-compose felül tudja írni a TZ env-vel
ENV TZ=Europe/Budapest

COPY --from=build /app/node_modules ./node_modules
COPY package.json ./
COPY prisma ./prisma
COPY src ./src
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN sed -i 's/\r$//' docker-entrypoint.sh \
 && chmod +x docker-entrypoint.sh \
 && mkdir -p /app/uploads \
 && chown -R node:node /app

USER node
EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD node -e "fetch('http://localhost:4000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["./docker-entrypoint.sh"]
