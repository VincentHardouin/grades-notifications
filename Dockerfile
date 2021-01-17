FROM node:12.19.1-alpine

WORKDIR /usr/src/app

COPY package*.json ./

ENV NODE_ENV=production

RUN npm ci

COPY . .

CMD [ "npm", "start" ]
