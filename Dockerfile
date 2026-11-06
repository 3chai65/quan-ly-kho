FROM node:22-bookworm-slim

# better-sqlite3 cần công cụ build khi cài (node-gyp) — đa số có prebuilt nhưng để chắc.
RUN apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY server.js ./
COPY src ./src
COPY migrations ./migrations
COPY tests/server.test.mjs ./tests/server.test.mjs

ENV NODE_ENV=production
ENV PORT=8787
ENV DATA_DIR=/data

EXPOSE 8787

CMD ["node", "server.js"]
