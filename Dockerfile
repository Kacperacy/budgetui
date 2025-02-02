# Stage 1: Build the application
FROM node:20-alpine as builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# Install dependencies
RUN pnpm install

RUN npm i -g serve

# Copy source code
COPY . .

RUN npm run build

EXPOSE 80

CMD ["serve", "-s", "dist"]