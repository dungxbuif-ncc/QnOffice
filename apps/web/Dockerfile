# ==========================================
# Stage 1: Build shared libs
# ==========================================
FROM node:20-alpine AS libs-builder

WORKDIR /workspace/libs

# Copy libs package files
COPY libs/package.json libs/yarn.lock* ./

# Install libs dependencies
RUN yarn install --frozen-lockfile

# Copy libs source and tsconfig
COPY libs/tsconfig.json ./
COPY libs/src ./src

# Build libs
RUN yarn build

# ==========================================
# Stage 2: Build frontend
# ==========================================
FROM node:20-alpine AS web-builder

WORKDIR /workspace/apps/web

# Copy frontend package files
COPY apps/web/package.json ./

# Copy built libs from libs-builder to local folder
COPY --from=libs-builder /workspace/libs /workspace/apps/web/libs

# Update dependency path to use local folder
RUN sed -i 's|"@qnoffice/shared": "file:../../libs"|"@qnoffice/shared": "file:./libs"|g' package.json

# Copy yarn.lock if exists
COPY apps/web/yarn.lock* ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy config files needed for build
COPY tailwind.config.js postcss.config.js ../../

# Copy frontend source
COPY apps/web ./

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build Next.js application
RUN yarn build

# ==========================================
# Stage 3: Production runtime
# ==========================================
FROM node:20-alpine

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create app user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy package files
COPY --from=web-builder --chown=nextjs:nodejs /workspace/apps/web/package.json ./

# Update dependency path to use local folder
RUN sed -i 's|"@qnoffice/shared": "file:../../libs"|"@qnoffice/shared": "file:./libs"|g' package.json

# Copy yarn.lock if exists
COPY --from=web-builder --chown=nextjs:nodejs /workspace/apps/web/yarn.lock* ./

# Copy built libs to production image
COPY --from=libs-builder --chown=nextjs:nodejs /workspace/libs /app/libs

# Install production dependencies only
RUN yarn install --frozen-lockfile --production && \
    yarn cache clean

# Copy Next.js build output
COPY --from=web-builder --chown=nextjs:nodejs /workspace/apps/web/.next/standalone ./
COPY --from=web-builder --chown=nextjs:nodejs /workspace/apps/web/.next/static ./.next/static
COPY --from=web-builder --chown=nextjs:nodejs /workspace/apps/web/public ./public

# Copy shared libs
COPY --from=libs-builder --chown=nextjs:nodejs /workspace/libs/dist ./node_modules/@qnoffice/shared/dist
COPY --from=libs-builder --chown=nextjs:nodejs /workspace/libs/package.json ./node_modules/@qnoffice/shared/

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start Next.js
CMD ["node", "server.js"]
