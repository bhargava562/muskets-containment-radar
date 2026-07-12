FROM node:24.4.1-alpine3.21

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . ./

ENV HOST=0.0.0.0
ENV PORT=5173
ENV VITE_BACKEND_URL=http://localhost:3001

EXPOSE 5173

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]