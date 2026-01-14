FROM node:20-alpine AS base

# Install dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy all package.json files for workspace
COPY package.json yarn.lock ./
COPY libs/package.json ./libs/
COPY apps/be/package.json ./apps/be/
COPY apps/web/package.json ./apps/web/

# Install ALL dependencies at root (this will link workspaces)
RUN yarn install 

# Builder stage
FROM base AS builder
WORKDIR /app

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/libs/node_modules ./libs/node_modules
COPY --from=deps /app/apps/be/node_modules ./apps/be/node_modules

# Copy source code
COPY . .

# Build shared library FIRST (this creates dist folder that BE depends on)
RUN yarn workspace @qnoffice/shared build

# Now build backend (it can import from @qnoffice/shared)
RUN yarn workspace qn-official-api build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs

# Copy production dependencies
COPY --from=deps --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=nestjs:nodejs /app/package.json ./package.json

# Copy built backend
COPY --from=builder --chown=nestjs:nodejs /app/apps/be/dist ./apps/be/dist

# Copy built shared library (needed at runtime)
COPY --from=builder --chown=nestjs:nodejs /app/libs/dist ./libs/dist
COPY --from=builder --chown=nestjs:nodejs /app/libs/package.json ./libs/package.json

USER nestjs

EXPOSE 3000

CMD ["node", "apps/be/dist/main.js"]
