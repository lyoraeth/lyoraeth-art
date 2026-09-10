FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9 --activate
WORKDIR /app
COPY package.json pnpm-lock.yaml .npmrc ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-alpine AS runner
WORKDIR /app
# ffmpeg (avif/webp/jpg) + cjxl (jxl — only cjxl does progressive) for the
# media:sync task. alpine's builds are current: ffmpeg 8, libjxl 0.11.
RUN apk add --no-cache ffmpeg libjxl-tools
COPY --from=builder /app/.output ./
ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health || exit 1
# 127.0.0.1, not localhost: alpine's /etc/hosts maps localhost to ::1 too and
# busybox wget tries IPv6 first, where node (HOST=0.0.0.0) isn't listening —
# the check had been failing since the image first shipped.
CMD ["node", "server/index.mjs"]
