FROM rocketchat/base:8

ENV RC_VERSION 0.63.0-develop

COPY ./rocketchatbundle /app 
WORKDIR /app/programs/server
RUN npm install --production

USER rocketchat

VOLUME /app/uploads

# needs a mongoinstance - defaults to container linking with alias 'mongo'
ENV DEPLOY_METHOD=docker \
    NODE_ENV=production \
    MONGO_URL=mongodb://mongo:27017/rocketchat \
    HOME=/tmp \
    PORT=3000 \
    ROOT_URL=http://localhost:3000 \
    Accounts_AvatarStorePath=/app/uploads

EXPOSE 3000

CMD ["node", "./bundle/main.js"]
