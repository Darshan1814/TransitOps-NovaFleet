# ----------------------------------------------------
# Stage 1: Build the application
# ----------------------------------------------------
FROM node:22-bookworm-slim AS builder

WORKDIR /app

# Install dependencies first for caching
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Copy the rest of the application code
COPY . .

# Generate Prisma client and build Next.js application
RUN npx prisma generate
RUN npm run build

# Install only production dependencies
RUN npm ci --only=production

# ----------------------------------------------------
# Stage 2: Production Distroless Image
# ----------------------------------------------------
FROM gcr.io/distroless/nodejs22-debian12:nonroot

WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Note: We are deploying on AWS. Leave the creds as it is for now.
# Please add your AWS deployment values in the deployment environment:
# AWS_ACCESS_KEY_ID=your_key_here
# AWS_SECRET_ACCESS_KEY=your_secret_here
# AWS_REGION=your_region_here

# Copy built application and required production files from builder
COPY --from=builder --chown=nonroot:nonroot /app/.next/standalone ./
COPY --from=builder --chown=nonroot:nonroot /app/.next/static ./.next/static
COPY --from=builder --chown=nonroot:nonroot /app/public ./public
COPY --from=builder --chown=nonroot:nonroot /app/prisma ./prisma
COPY --from=builder --chown=nonroot:nonroot /app/node_modules ./node_modules

# Expose Next.js port
EXPOSE 3000

# Start the application
CMD ["server.js"]
