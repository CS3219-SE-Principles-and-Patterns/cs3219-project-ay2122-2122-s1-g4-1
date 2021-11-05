# run redis container for redis adapter
# docker run --name my-redis -p 6379:6379 -d redis
FROM node:14

# Create app directory
WORKDIR /usr/src/app

# args

ARG redis_cluster_url
ENV redis_cluster_url $redis_cluster_url

ARG redis_follower_url
ENV redis_follower_url $redis_follower_url

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 9000
CMD ["npm", "start"]