# build stage
FROM node:18-alpine as build-stage

WORKDIR /app

# copy package and package-lock
COPY package*.json ./

# clean install
RUN npm ci

# copy rest of project into /app
COPY . .

# creates /app/dist final code
RUN npm run build

# production stage
FROM nginx:stable-alpine as production-stage
COPY --from=build-stage /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# docker build -t nergy101/catpouch .