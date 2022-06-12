FROM node:16-alpine AS builder
RUN npm install -g pnpm@6.32.19
WORKDIR /client
COPY pnpm-lock.yaml ./
RUN pnpm fetch
ADD . ./
RUN pnpm install --offline && pnpm run build

FROM node:16-alpine
RUN npm install -g pnpm@6.32.19
WORKDIR /client
COPY pnpm-lock.yaml ./
RUN pnpm fetch --prod
COPY package.json ./
COPY --from=builder /client/dist ./dist
RUN pnpm install --offline --prod

ENV LISTEN_ADDR="0.0.0.0:4001" KEY=""

CMD node dist/app.js -l ${LISTEN_ADDR} -k ${KEY:-$(hostname)}
