FROM node:20-alpine

WORKDIR /app

ENV HUSKY=0

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

ENV NODE_ENV=production
EXPOSE 3001
CMD ["npm", "start"]
