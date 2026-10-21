# ARQUIVO 29 → Dockerfile  (API Node em container)
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
# 1) dependencias primeiro (aproveita o cache do Docker)
COPY package*.json ./
RUN npm ci --omit=dev
# 2) codigo da API (inclui src/data/estados.geojson)
COPY src ./src
EXPOSE 3000
# roda sem ser root
USER node
CMD ["node", "src/server.js"]