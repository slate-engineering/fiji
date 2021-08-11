# Fiji

Websocket micro-service

### Environment Variables

To use this with https://github.com/filecoin-project/slate you need the following environment variables. Use your current development `.env` variables.

```sh
POSTGRES_ADMIN_PASSWORD=XXX
POSTGRES_ADMIN_USERNAME=XXX
POSTGRES_HOSTNAME=XXX
POSTGRES_DATABASE=XXX
TEXTILE_HUB_KEY=XXX
TEXTILE_HUB_SECRET=XXX
JWT_SECRET=XXX
PUBSUB_SECRET=pKLO4lbzdMrhAFKwPo9bnmq03bxQrtu3
SOURCE=fiji
NODE_ENV=development
```

### Run the server

```sh
npm install
npm run dev
```
