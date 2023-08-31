import dotenv from "dotenv";
import logger, { exitLog } from "@logger";
import { Level, levels } from "log4js";
import utils from "@utils";

class Config {
  private static instance?: Config;

  public readonly LOG_LEVEL: Level;
  public readonly ENV: "production" | "development";
  public readonly DB_AUTH: DB_CONFIG = {
    NAME: "",
    SCHEMA: "",
    USER: "",
    PASS: "",
    HOST: "",
    PORT: 5555,
    DIALECT: "",
  };
  public readonly DB_STRING: string = "";
  public readonly SERVER_PORT: number;
  public readonly JWT_SECRET: string = "";
  public readonly AWS_CONFIG: AWS_CONFIG = {
    ACCESS_KEY_ID: "",
    SECRET_ACCESS_KEY: "",
    S3_BUCKET_REGION: "",
    S3_BUCKET_NAME: "",
  };

  public readonly MICROSERVICE_CONFIG: MICROSERVICE_CONFIG = {
    MICROSERVICE_HOST: "",
    MICROSERVICE_PORT: 5001,
  };

  static getInstance(): Config {
    if (!this.instance) this.instance = new Config();
    return this.instance;
  }

  constructor() {
    const env = dotenv.config();
    if (env.error) exitLog("Missing environment file or bad .env");
    this.ENV = "production";
    if (!process.env.NODE_ENV || process.env.NODE_ENV.includes("dev")) this.ENV = "development";
    this.LOG_LEVEL = this.parseLogLevel();
    this.SERVER_PORT = this.parseServerPort() || 3000;
    this.JWT_SECRET = this.parseJWTSecret();
    this.DB_AUTH = this.parseDBConfig();
    this.AWS_CONFIG = this.parseAWSConfig();
    this.MICROSERVICE_CONFIG = this.parseMicroserviceConfig();
  }

  private parseDBConfig(): DB_CONFIG {
    const DB_HOST = process.env.DB_HOST;
    if (utils.isUndefinedOrEmpty(DB_HOST)) exitLog(`Missing or Bad DB_HOST in .env`);
    const DB_NAME = process.env.DB_NAME;
    if (utils.isUndefinedOrEmpty(DB_NAME)) exitLog(`Missing or Bad DB_NAME in .env`);
    const DB_USER = process.env.DB_USER;
    if (utils.isUndefinedOrEmpty(DB_USER)) exitLog(`Missing or Bad DB_USER in .env`);
    const DB_PASS = process.env.DB_PASS;
    if (utils.isUndefinedOrEmpty(DB_PASS)) exitLog(`Missing or Bad DB_PASS in .env`);
    const DB_DIALECT = process.env.DB_DIALECT;
    if (utils.isUndefinedOrEmpty(DB_DIALECT)) exitLog(`Missing or Bad DB_DIALECT in .env`);
    const DB_SCHEMA = process.env.DB_SCHEMA;
    if (utils.isUndefinedOrEmpty(DB_SCHEMA)) exitLog(`CHEMA in .env`);

    let DB_PORT = 5555;
    const __DB_PORT = process.env.DB_PORT;
    if (!utils.isUndefinedOrEmpty(__DB_PORT)) {
      const port = parseInt(`${__DB_PORT}`);
      if (isNaN(port)) exitLog(`Bad DB_PORT in .env`);
      DB_PORT = port;
    }

    const __DB_STRING = process.env.DB_STRING;
    let DB_STRING = `${DB_DIALECT}://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=${DB_SCHEMA}`;

    console.log(__DB_STRING, DB_STRING);

    if (utils.isUndefinedOrEmpty(__DB_STRING) || __DB_STRING != DB_STRING) exitLog(`Missing or Bad DB_STRING in .env`);

    return {
      NAME: DB_NAME as string,
      SCHEMA: DB_NAME as string,
      USER: DB_USER as string,
      PASS: DB_PASS as string,
      HOST: DB_HOST as string,
      DIALECT: DB_DIALECT as string,
      PORT: DB_PORT,
    };
  }

  private parseAWSConfig(): AWS_CONFIG {
    const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
    if (utils.isUndefinedOrEmpty(AWS_ACCESS_KEY_ID)) exitLog(`Missing or Bad AWS_ACCESS_KEY_ID in .env`);
    const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
    if (utils.isUndefinedOrEmpty(AWS_SECRET_ACCESS_KEY)) exitLog(`Missing or Bad AWS_SECRET_ACCESS_KEY in .env`);
    const AWS_S3_BUCKET_REGION = process.env.AWS_S3_BUCKET_REGION;
    if (utils.isUndefinedOrEmpty(AWS_S3_BUCKET_REGION)) exitLog(`Missing or Bad AWS_S3_BUCKET_REGION in .env`);
    const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
    if (utils.isUndefinedOrEmpty(AWS_S3_BUCKET_NAME)) exitLog(`Missing or Bad AWS_S3_BUCKET_NAME in .env`);

    return {
      ACCESS_KEY_ID: AWS_ACCESS_KEY_ID as string,
      SECRET_ACCESS_KEY: AWS_SECRET_ACCESS_KEY as string,
      S3_BUCKET_REGION: AWS_S3_BUCKET_REGION as string,
      S3_BUCKET_NAME: AWS_S3_BUCKET_NAME as string,
    };
  }

  private parseJWTSecret(): string {
    const __JWT_SECRET = process.env.JWT_SECRET;
    if (utils.isUndefinedOrEmpty(__JWT_SECRET)) exitLog(`Missing or Bad JWT_SECRET in .env`);
    return __JWT_SECRET as string;
  }

  private parseServerPort(): number | undefined {
    const __serverPort = process.env.SERVER_PORT;
    if (!__serverPort) return undefined;
    const port = parseInt(`${__serverPort}`);
    if (isNaN(port)) exitLog("Invalid server port");
    return port;
  }

  private parseMicroserviceConfig(): MICROSERVICE_CONFIG {
    const MICROSERVICE_HOST = process.env.MICROSERVICE_HOST;
    if (utils.isUndefinedOrEmpty(MICROSERVICE_HOST)) exitLog(`Missing or Bad MICROSERVICE_HOST in .env`);

    let MICROSERVICE_PORT = 5001;
    const __MICROSERVICE_PORT = process.env.MICROSERVICE_PORT;
    if (!utils.isUndefinedOrEmpty(__MICROSERVICE_PORT)) {
      const port = parseInt(`${__MICROSERVICE_PORT}`);
      if (isNaN(port)) exitLog(`Bad MICROSERVICE_PORT in .env`);
      MICROSERVICE_PORT = port;
    }

    return {
      MICROSERVICE_HOST: MICROSERVICE_HOST as string,
      MICROSERVICE_PORT: MICROSERVICE_PORT,
    };
  }

  private parseLogLevel(): Level {
    let log = "";
    if (!process.env.LOG_LEVEL) exitLog(`Missing LOG_LEVEL in .env`);
    log = process.env.LOG_LEVEL.toUpperCase();
    switch (log) {
      case "DEBUG":
        return levels.DEBUG;
      case "INFO":
        return levels.INFO;
      case "WARN":
        return levels.WARN;
      case "ERROR":
        return levels.ERROR;
      case "FATAL":
        return levels.FATAL;
      case "OFF":
        return levels.OFF;
      case "ALL":
        return levels.ALL;
      default:
        return exitLog(`Bad LOG_LEVEL in .env`);
    }
  }
}
export default Config.getInstance();

// Types
type DB_CONFIG = {
  NAME: string;
  SCHEMA: string;
  USER: string;
  PASS: string;
  HOST: string;
  PORT: number;
  DIALECT: string;
};

type AWS_CONFIG = {
  ACCESS_KEY_ID: string;
  SECRET_ACCESS_KEY: string;
  S3_BUCKET_REGION: string;
  S3_BUCKET_NAME: string;
};

type MICROSERVICE_CONFIG = {
  MICROSERVICE_HOST: string;
  MICROSERVICE_PORT: number;
};
