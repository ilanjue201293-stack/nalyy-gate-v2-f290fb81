FROM node:22-slim

WORKDIR /app

COPY bot-runtime/package.json bot-runtime/.npmrc ./
COPY bot-runtime/prisma ./prisma

RUN npm install --no-audit --no-fund --progress=false

COPY bot-runtime ./

ENV NODE_ENV=production

CMD ["npm", "run", "bot"]
