FROM node:12.19.1-alpine as dependencies

WORKDIR /app
COPY package*.json ./
ENV NODE_ENV=production
RUN npm ci

FROM node:12.19.1-alpine

COPY --from=dependencies /app /
COPY . .
ENV NODE_ENV=production
EXPOSE 8080
CMD [ "npm", "start" ]
