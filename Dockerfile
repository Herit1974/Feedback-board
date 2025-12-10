FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm install --production || npm install --production

# Copy app sources
COPY . .

EXPOSE 3000
CMD ["npm", "start"]
