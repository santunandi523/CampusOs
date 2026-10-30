FROM node:20-alpine

WORKDIR /app

# Copy package descriptors first for Docker layer caching
COPY package*.json ./

RUN npm ci --only=production || npm install --production

# Copy application source code
COPY . .

# Expose backend port
EXPOSE 5000

ENV NODE_ENV=production
ENV PORT=5000

CMD ["node", "server.js"]

