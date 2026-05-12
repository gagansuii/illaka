# multi-stage build for a Next.js application

# base stage installs dependencies and builds the application
FROM node:20-alpine AS builder
WORKDIR /app

# install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# copy source and build
COPY . .
RUN npm run build

# production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Run as non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# copy over built assets and dependencies
COPY --from=builder /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./

USER nextjs

EXPOSE 3000

ENV PORT=3000

# Liveness probe: verify the app responds within 30s of startup
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget -qO- "http://localhost:3000/api/health?type=liveness" || exit 1

CMD ["npm", "run", "start"]
