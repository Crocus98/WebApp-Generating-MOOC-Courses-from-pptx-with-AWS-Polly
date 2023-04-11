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
    USER: "",
    PASS: "",
    HOST: "",
    PORT: 3306,
  };
  public readonly DB_STRING: string = "";
  public readonly SERVER_PORT: number;
  public readonly JWT_SECRET: string = "";

  static getInstance(): Config {
    if (!this.instance) this.instance = new Config();
    return this.instance;
  }

  constructor() {
    const env = dotenv.config();
    if (env.error) exitLog("Missing environment file or bad .env");
    this.ENV = "production";
    if (!process.env.NODE_ENV || process.env.NODE_ENV.includes("dev"))
      this.ENV = "development";
    this.LOG_LEVEL = this.parseLogLevel();
    this.SERVER_PORT = this.parseServerPort() || 3000;
    this.JWT_SECRET = this.parseJWTSecret();
  }

  parseJWTSecret(): string {
    const __JWT_SECRET = process.env.JWT_SECRET;
    if (utils.isUndefinedOrEmpty(__JWT_SECRET))
      exitLog(`Missing or Bad JWT_SECRET in .env`);
    return __JWT_SECRET as string;
  }

  private parseServerPort(): number | undefined {
    const __serverPort = process.env.SERVER_PORT;
    if (!__serverPort) return undefined;
    const port = parseInt(`${__serverPort}`);
    if (isNaN(port)) exitLog("Invalid server port");
    return port;
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
  USER: string;
  PASS: string;
  HOST: string;
  PORT: number;
};
