FROM node:24-alpine

WORKDIR /app

# Enable corepack for yarn v4
RUN corepack enable

# Install dependencies first (for better caching)
COPY package.json yarn.lock .yarnrc.yml ./
COPY .yarn ./.yarn
RUN yarn install --immutable

# Copy source code
COPY . .

# Build backend and frontend
RUN yarn build
RUN cd frontend && yarn install --immutable && yarn build

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Expose HTTP port
EXPOSE 3000

# Start HTTP server
CMD ["node", "dist/server-http.js"]
