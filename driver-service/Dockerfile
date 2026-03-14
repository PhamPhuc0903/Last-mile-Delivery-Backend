FROM node:23-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY src .

EXPOSE 3000

CMD ["node", "src/server.js"]

#FROM ubuntu:latest
#LABEL authors="HP"
#
#ENTRYPOINT ["top", "-b"]