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
# Stage 2: Build backend
# ==========================================

FROM node:20-alpine AS be-builder

WORKDIR /workspace/apps/be

# Copy backend package files
COPY apps/be/package.json ./

COPY --from=libs-builder /workspace/libs /workspace/apps/be/libs

RUN sed -i 's|"@qnoffice/shared": "file:../../libs"|"@qnoffice/shared": "file:./libs"|g' package.json

# Copy yarn.lock if exists
COPY apps/be/yarn.lock* ./

# Install dependencies
RUN yarn install --frozen-lockfile

# Copy backend source
COPY apps/be ./

# Build backend
RUN yarn build

# ==========================================
# Stage 3: Production runtime
# ==========================================
FROM node:20-alpine

RUN apk add --no-cache dumb-init

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

WORKDIR /app
RUN mkdir -p mezon-cache && chown -R nestjs:nodejs /app
COPY --from=be-builder --chown=nestjs:nodejs /workspace/apps/be/package.json ./
RUN sed -i 's|"@qnoffice/shared": "file:../../libs"|"@qnoffice/shared": "file:./libs"|g' package.json

COPY --from=be-builder --chown=nestjs:nodejs /workspace/apps/be/yarn.lock* ./

COPY --from=libs-builder --chown=nestjs:nodejs /workspace/libs /app/libs
RUN yarn install --frozen-lockfile --production && \
    yarn cache clean

COPY --from=be-builder --chown=nestjs:nodejs /workspace/apps/be/dist ./dist

USER nestjs

EXPOSE 4000

ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/main.js"]
