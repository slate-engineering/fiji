import * as Environment from "~/node_common/environment";

import configs from "~/knexfile";
import knex from "knex";

const envConfig = configs[Environment.NODE_ENV];
const Database = knex(envConfig);

export default Database;
