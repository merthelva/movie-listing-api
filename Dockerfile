# ─── Stage 1: Builder ───────────────────────────────────────────────────────
FROM node:22-alpine AS builder

# Install pnpm
RUN npm install -g pnpm@10.18.1

WORKDIR /app

# Copy dependency manifests first (cache layer optimization)
COPY package.json pnpm-lock.yaml ./

# Install ALL dependencies (including devDependencies needed for build)
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build (webpack bundles everything into dist/main.js, resolving path aliases)
RUN pnpm build

# ─── Stage 2: Production ────────────────────────────────────────────────────
FROM node:22-alpine AS production

# Install pnpm
RUN npm install -g pnpm@10.18.1

# Create non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy dependency manifests
COPY package.json pnpm-lock.yaml ./

# Install ONLY production dependencies
RUN pnpm install --frozen-lockfile --prod --ignore-scripts

# Copy compiled output from builder stage
COPY --from=builder /app/dist ./dist

# Copy migration source and TypeORM data-source for CLI
COPY --from=builder /app/src/database ./src/database
COPY tsconfig.json ./

# Switch to non-root user
USER appuser

EXPOSE 3000

CMD ["node", "dist/main"]