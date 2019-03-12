FROM node:11-alpine

RUN apk update && apk upgrade && \
  echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories && \
  echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories && \
  apk add --no-cache \
  chromium@edge \
  harfbuzz@edge \
  nss@edge

ENV DOCKER=true
ENV CONCURRENCY=5
ENV DEFAUL_TTIMEOUT=60000
ENV USER_DATA_DIR='data/browser'
ENV EXECUTABLE_PATH='/usr/bin/chromium-browser'

WORKDIR /app

COPY . /app

RUN yarn --production

CMD ["yarn", "start"]