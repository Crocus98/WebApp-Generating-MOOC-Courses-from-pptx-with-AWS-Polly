FROM node:16-alpine
#Set working directory to /app
WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 3001

CMD npm run service:buildAndRun