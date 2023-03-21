import dotenv from 'dotenv'
import logger, { exitLog } from '@logger'

import { Level, levels } from "log4js";

class Config {
  private static instance?: Config;

  public readonly LOG_LEVEL: Level
  public readonly ENV: "production" | "development"
  public readonly DB_AUTH: DB_CONFIG = { NAME: '', USER: '', PASS: '', HOST: '', PORT: 3306}
  public readonly DB_STRING: string = ""
  public readonly SERVER_PORT: number

  static getInstance(): Config {
    if(!this.instance) this.instance = new Config();
    return this.instance;
  }

  constructor() {
    const env = dotenv.config()
    if(env.error) exitLog('Missing environment file or bad .env')
    this.ENV = "production";
    if(!process.env.NODE_ENV || process.env.NODE_ENV.includes('dev')) this.ENV = "development";
    this.LOG_LEVEL = this.parseLogLevel()
    this.DB_AUTH = this.parseDBConfig()
    this.SERVER_PORT = this.parseServerPort() || 3000
  }

  private parseServerPort(): number | undefined { 
    const __serverPort = process.env.SERVER_PORT
    if(!__serverPort) return undefined
    const port = parseInt(`${__serverPort}`)
    if(isNaN(port)) exitLog("Invalid server port")
    return port
  }

  private parseLogLevel(): Level {
    let log = ''
    if(!process.env.LOG_LEVEL)  exitLog(`Missing LOG_LEVEL in .env`)
    log = process.env.LOG_LEVEL.toUpperCase();
    switch (log) {
      case 'DEBUG':
        return levels.DEBUG
      case 'INFO':
        return levels.INFO
      case 'WARN':
        return levels.WARN
      case 'ERROR':
        return levels.ERROR
      case 'FATAL':
        return levels.FATAL
      case 'OFF':
        return levels.OFF
      case "ALL":
        return levels.ALL
      default:
        return exitLog(`Bad LOG_LEVEL in .env`)
    }
  }

  private parseDBConfig(): DB_CONFIG {
    const DB_HOST = process.env.DB_HOST
    if(this.isUndefinedOrEmpty(DB_HOST)) exitLog(`Missing or Bad DB_HOST in .env`)
    const DB_NAME = process.env.DB_NAME
    if(this.isUndefinedOrEmpty(DB_NAME)) exitLog(`Missing or Bad DB_NAME in .env`)
    const DB_USER = process.env.DB_USER
    if(this.isUndefinedOrEmpty(DB_USER)) exitLog(`Missing or Bad DB_USER in .env`)
    const DB_PASS = process.env.DB_PASS
    if(this.isUndefinedOrEmpty(DB_PASS)) exitLog(`Missing or Bad DB_PASS in .env`)

    let DB_PORT = 3306
    const __DB_PORT = process.env.DB_PORT
    if(!this.isUndefinedOrEmpty(__DB_PORT)){
      const port = parseInt(`${__DB_PORT}`)
      if(isNaN(port)) exitLog(`Bad DB_PORT in .env`)
      DB_PORT = port
    }

    const __DB_STRING = process.env.DB_STRING
    let DB_STRING = `mysql://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}`
    if(this.isUndefinedOrEmpty(__DB_STRING) || __DB_STRING != DB_STRING) exitLog(`Missing or Bad DB_STRING in .env`)

    return {
      HOST: DB_HOST as string,
      NAME: DB_NAME as string,
      USER: DB_USER as string,
      PASS: DB_PASS as string,
      PORT: DB_PORT,
    }
  }

  private isUndefinedOrEmpty(value: string | undefined): boolean {
    return ( value === undefined || value.trim().length === 0)
  }
}
export default Config.getInstance();

// Types
type DB_CONFIG = {
  NAME: string
  USER: string
  PASS: string
  HOST: string
  PORT: number,
}
