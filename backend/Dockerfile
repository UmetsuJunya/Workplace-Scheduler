# ベースイメージ
FROM node:24.2.0-alpine AS base

# 依存関係インストール用ステージ
FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++ openssl openssl-dev
WORKDIR /app

# 依存関係ファイルをコピー
COPY package.json package-lock.json* ./
RUN npm ci

# ビルド用ステージ
FROM base AS builder
RUN apk add --no-cache openssl openssl-dev
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# DATABASE_URLをビルド引数として受け取る（Prisma generate用）
ARG DATABASE_URL
ENV DATABASE_URL=${DATABASE_URL}

# Prisma クライアントを生成
RUN npx prisma generate

# プロダクションビルド
RUN npm run build

# 本番実行用ステージ
FROM base AS runner
RUN apk add --no-cache openssl openssl-dev
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# 必要なファイルのみをコピー
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/prisma.config.ts ./prisma.config.ts

USER nestjs

EXPOSE 3001

ENV PORT 3001

CMD ["node", "dist/src/main"]
