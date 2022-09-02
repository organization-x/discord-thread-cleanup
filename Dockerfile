FROM node:18-alpine

RUN apk add --no-cache git

RUN mkdir /bot

RUN git clone https://github.com/organization-x/discord-js-thread-cleanup /bot

RUN cd /bot && ls -lah && npm i

ENTRYPOINT [ "node", "/bot/index.js" ]
