# syntax=docker/dockerfile:1

# ---------------------------------------------------------------- build stage
FROM node:22-alpine AS build

WORKDIR /app

# Dependencies first, so a source-only change reuses this layer.
COPY package.json package-lock.json ./
RUN npm ci

COPY index.html vite.config.mjs ./
COPY public ./public
COPY src ./src

# The API origin is baked into the bundle at build time: Vite substitutes
# VITE_* rather than reading it at runtime. Leave it empty to call the API on
# the same origin as the page (the default, and what the nginx config below
# serves).
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ------------------------------------------------------------- runtime stage
FROM nginx:1.30-alpine AS runtime

# Run nginx as an unprivileged user: it needs a writable cache directory and a
# pid file it can create (/run is root-owned, so the pid moves to /tmp), and the
# `user` directive is meaningless without root.
RUN adduser -D -u 10001 webapp \
 && sed -i -e 's|^pid .*|pid /tmp/nginx.pid;|' -e '/^user /d' /etc/nginx/nginx.conf \
 && chown -R webapp:webapp /var/cache/nginx /usr/share/nginx/html

COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=webapp:webapp /app/build /usr/share/nginx/html

USER webapp
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1:8080/healthz || exit 1

CMD ["nginx", "-g", "daemon off;"]
