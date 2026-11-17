# ---- Stufe 1: nur zum Vorbereiten des Datenordners
FROM node:22-alpine AS prep
RUN mkdir -p /out/data && chown 65532:65532 /out/data && chmod 700 /out/data

# ---- Stufe 2: Laufzeit – "distroless": keine Shell, kein Paketmanager, kein root
FROM gcr.io/distroless/nodejs22-debian12:nonroot
ENV NODE_ENV=production PORT=3000 DATA_DIR=/data
WORKDIR /app
COPY --chown=0:0 package.json server.js ./
COPY --chown=0:0 public ./public
COPY --from=prep --chown=65532:65532 /out/data /data
USER 65532:65532
VOLUME ["/data"]
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD ["/nodejs/bin/node", "-e", "require('http').get('http://127.0.0.1:3000/healthz',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"]
CMD ["server.js"]
