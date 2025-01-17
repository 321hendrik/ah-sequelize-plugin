import { Sequelize } from "sequelize-typescript";
import { api, config, Initializer, log } from "actionhero";
import { Migrations } from "../modules/migrations";

declare module "actionhero" {
  export interface Api {
    sequelize: Sequelize;
  }
}

export class SequelizeInitializer extends Initializer {
  constructor() {
    super();
    this.name = "sequelize";
    this.loadPriority = 201;
    this.stopPriority = 9000;
  }

  async initialize() {
    api.sequelize = new Sequelize(config.sequelize);
    await this.test();

    if (config.sequelize.autoMigrate) {
      log("running sequelize migrations", "debug");
      await api.sequelize.transaction(async () => {
        await Migrations.migrate(
          config.sequelize,
          api.sequelize,
          log,
          config.sequelize.migrationLogLevel
        );
      });
    } else {
      log("skipping sequelize migrations", "debug");
    }
  }

  async stop() {
    await api.sequelize.close();
  }

  async test() {
    let query = "SELECT NOW()";
    if (config.sequelize.dialect === "mssql") query = "SELECT GETDATE();";
    if (config.sequelize.dialect === "sqlite")
      query = "SELECT strftime('%s', 'now');";

    await api.sequelize.query(query);
  }
}
