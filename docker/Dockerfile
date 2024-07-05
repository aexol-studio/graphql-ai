FROM node:22-alpine AS builder
WORKDIR /home/node
COPY --chown=node:node . .
RUN ls -l
RUN npm ci --prefer-offline
RUN ["npm", "run", "build", "-w", "packages/core"]

FROM node:22-alpine
WORKDIR /home/node
COPY --from=builder /home/node .
RUN pwd
RUN ls -l
RUN ls -l packages/core
EXPOSE 8080
CMD [ "npm", "run", "start", "-w", "packages/core"]
