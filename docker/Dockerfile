FROM node:22-alpine AS builder
WORKDIR /home/node
COPY --chown=node:node ../ .
RUN npm ci --prefer-offline
RUN ["npm", "run", "build", "-w", "packages/core"]

FROM node:22-alpine
WORKDIR /home/node
COPY --from=builder /home/node .
EXPOSE 8080
CMD [ "npm", "run", "start", "-w", "packages/core"]
