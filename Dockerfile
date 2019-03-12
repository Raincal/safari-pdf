FROM node:11-alpine

RUN apk update && apk upgrade && \
  echo @edge http://nl.alpinelinux.org/alpine/edge/community >> /etc/apk/repositories && \
  echo @edge http://nl.alpinelinux.org/alpine/edge/main >> /etc/apk/repositories && \
  apk add --no-cache \
  chromium@edge \
  harfbuzz@edge \
  nss@edge

WORKDIR /app

COPY . /app

RUN yarn --production

CMD ["yarn", "start"]