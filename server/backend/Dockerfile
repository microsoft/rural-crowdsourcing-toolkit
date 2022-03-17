FROM karya-root:latest AS builder

WORKDIR /usr/src/karya/backend 

FROM node:14.18.2
WORKDIR /usr/src/karya/backend 

COPY --from=builder /usr/src/karya/backend /usr/src/karya/backend 
COPY --from=builder /usr/src/karya/common /usr/src/karya/common 
COPY --from=builder /usr/src/karya/core /usr/src/karya/core
COPY --from=builder /usr/src/karya/utils /usr/src/karya/utils

EXPOSE 5000
