import * as Environment from "~/node_common/environment";

const developmentConfig = {
  client: "pg",
  connection: {
    ssl: true,
    port: 5432,
    host: Environment.POSTGRES_HOSTNAME,
    database: Environment.POSTGRES_DATABASE,
    user: Environment.POSTGRES_ADMIN_USERNAME,
    password: Environment.POSTGRES_ADMIN_PASSWORD,
  },
};

const productionConfig = {
  client: "pg",
  connection: {
    ssl: true,
    port: 5432,
    host: Environment.POSTGRES_HOSTNAME,
    database: Environment.POSTGRES_DATABASE,
    user: Environment.POSTGRES_ADMIN_USERNAME,
    password: Environment.POSTGRES_ADMIN_PASSWORD,
  },
};

module.exports = {
  development: developmentConfig,
  staging: productionConfig,
  production: productionConfig,
};
