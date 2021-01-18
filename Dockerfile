FROM node:12.19.1-alpine as build

WORKDIR /app
COPY package*.json ./
ENV NODE_ENV=production
RUN npm ci
COPY . .

CMD [ "npm", "start" ]

FROM node:12.19.1-alpine

COPY --from=build /app /
ENV NODE_ENV=production
EXPOSE 8080
CMD [ "npm", "start" ]
