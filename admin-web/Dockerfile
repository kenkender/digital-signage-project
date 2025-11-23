ARG NODE_VERSION=20-alpine
FROM node:${NODE_VERSION} AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .

# Build-time API base URL (default = host-exposed backend)
ARG VITE_API_BASE_URL=http://localhost:5000/api
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}

RUN npm run build

FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
