FROM node:16-slim
RUN apt-get update
# Set working directory
WORKDIR /usr/src/app
# Copy application dependencies
COPY package*.json yarn.lock ./
RUN yarn
COPY . .
RUN yarn build
# Install node packages

# Install typescript and add node classes
# RUN npm install -g typescript
# RUN npm install @types/node --save
USER node
EXPOSE 80
CMD [ "node", "." ]