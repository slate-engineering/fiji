export const NODE = process.env.NODE_ENV || "development";
export const IS_PRODUCTION = NODE === "production";
export const PORT = process.env.PORT || 6464;
export const SOURCE = process.env.SOURCE;

if (!IS_PRODUCTION) {
  require("dotenv").config();
}

export const POSTGRES_ADMIN_PASSWORD = process.env.POSTGRES_ADMIN_PASSWORD;
export const POSTGRES_ADMIN_USERNAME = process.env.POSTGRES_ADMIN_USERNAME;
export const POSTGRES_HOSTNAME = process.env.POSTGRES_HOSTNAME;
export const POSTGRES_DATABASE = process.env.POSTGRES_DATABASE;
export const JWT_SECRET = process.env.JWT_SECRET;
export const PUBSUB_SECRET = process.env.PUBSUB_SECRET;
export const TEXTILE_HUB_KEY = process.env.TEXTILE_HUB_KEY;
export const TEXTILE_HUB_SECRET = process.env.TEXTILE_HUB_SECRET;
