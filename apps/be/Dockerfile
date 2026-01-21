FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy dependency definitions
COPY package.json yarn.lock ./
COPY libs/package.json ./libs/package.json
COPY apps/web/package.json ./apps/web/package.json
COPY apps/be/package.json ./apps/be/package.json

# Install dependencies
RUN yarn install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build backend
# Ensure libs dependencies are installed and available
RUN yarn workspace @qnoffice/shared build
RUN yarn workspace qn-official-api build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nestjs

# Install production dependencies only?
# Actually, NestJS usually bundles everything or we run with node_modules.
# For simplicity with 'nest build' output:
# copy dist and node_modules
# OR if we want to reduce size, we reinstall prod deps.
# But NestJS doesn't bundle node_modules by default (unlike Next.js standalone).
# So we need node_modules.

COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/apps/be/dist ./dist
# Copy libs if they are needed at runtime?
# If the code imports from libs, and ts-node/nest compiles them into the dist, we are fine.
# But if it relies on node_modules/@qnoffice/shared mapping...
# The 'file:../../libs' dependency means it is symlinked or copied to node_modules.
# Since we copied /app/node_modules, the symlink might be broken if ../../libs is missing in runner!
# We must copy libs source to runner OR ensure they are packed.
# 'file:' protocol usually creates a symlink in node_modules.
# In Docker, we need the target of the symlink to exist.
COPY --from=builder --chown=nestjs:nodejs /app/libs ./libs
# Also copy package.jsons to maintain structure if needed, but not strictly required for runtime execution if node_modules are resolved.
# However, symlinks resolve relative to the link location.
# node_modules/@qnoffice/shared -> ../../../libs
# So we need /app/libs to exist.

# Extra runtime libs for Puppeteer (from original Dockerfile)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create cache directory with correct permissions
RUN mkdir -p /app/mezon-cache && chown nestjs:nodejs /app/mezon-cache

USER nestjs

EXPOSE 3000
ENV PORT 3000

CMD ["node", "dist/src/main.js"]
