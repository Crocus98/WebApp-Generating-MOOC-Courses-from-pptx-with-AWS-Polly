"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
const _logger_1 = require("@logger");
const log4js_1 = require("log4js");
const _utils_1 = tslib_1.__importDefault(require("@utils"));
class Config {
    static getInstance() {
        if (!this.instance)
            this.instance = new Config();
        return this.instance;
    }
    constructor() {
        this.DB_AUTH = {
            NAME: "",
            SCHEMA: "",
            USER: "",
            PASS: "",
            HOST: "",
            PORT: 5555,
            DIALECT: "",
        };
        this.DB_STRING = "";
        this.JWT_SECRET = "";
        this.AWS_CONFIG = {
            ACCESS_KEY_ID: "",
            SECRET_ACCESS_KEY: "",
            S3_BUCKET_REGION: "",
            S3_BUCKET_NAME: "",
        };
        this.MICROSERVICE_CONFIG = {
            MICROSERVICE_HOST: "",
            MICROSERVICE_PORT: 5001
        };
        const env = dotenv_1.default.config();
        if (env.error)
            (0, _logger_1.exitLog)("Missing environment file or bad .env");
        this.ENV = "production";
        if (!process.env.NODE_ENV || process.env.NODE_ENV.includes("dev"))
            this.ENV = "development";
        this.LOG_LEVEL = this.parseLogLevel();
        this.SERVER_PORT = this.parseServerPort() || 3000;
        this.JWT_SECRET = this.parseJWTSecret();
        this.DB_AUTH = this.parseDBConfig();
        this.AWS_CONFIG = this.parseAWSConfig();
        this.MICROSERVICE_CONFIG = this.parseMicroserviceConfig();
    }
    parseDBConfig() {
        const DB_HOST = process.env.DB_HOST;
        if (_utils_1.default.isUndefinedOrEmpty(DB_HOST))
            (0, _logger_1.exitLog)(`Missing or Bad DB_HOST in .env`);
        const DB_NAME = process.env.DB_NAME;
        if (_utils_1.default.isUndefinedOrEmpty(DB_NAME))
            (0, _logger_1.exitLog)(`Missing or Bad DB_NAME in .env`);
        const DB_USER = process.env.DB_USER;
        if (_utils_1.default.isUndefinedOrEmpty(DB_USER))
            (0, _logger_1.exitLog)(`Missing or Bad DB_USER in .env`);
        const DB_PASS = process.env.DB_PASS;
        if (_utils_1.default.isUndefinedOrEmpty(DB_PASS))
            (0, _logger_1.exitLog)(`Missing or Bad DB_PASS in .env`);
        const DB_DIALECT = process.env.DB_DIALECT;
        if (_utils_1.default.isUndefinedOrEmpty(DB_DIALECT))
            (0, _logger_1.exitLog)(`Missing or Bad DB_DIALECT in .env`);
        const DB_SCHEMA = process.env.DB_SCHEMA;
        if (_utils_1.default.isUndefinedOrEmpty(DB_SCHEMA))
            (0, _logger_1.exitLog)(`CHEMA in .env`);
        let DB_PORT = 5555;
        const __DB_PORT = process.env.DB_PORT;
        if (!_utils_1.default.isUndefinedOrEmpty(__DB_PORT)) {
            const port = parseInt(`${__DB_PORT}`);
            if (isNaN(port))
                (0, _logger_1.exitLog)(`Bad DB_PORT in .env`);
            DB_PORT = port;
        }
        const __DB_STRING = process.env.DB_STRING;
        let DB_STRING = `${DB_DIALECT}://${DB_USER}:${DB_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=${DB_SCHEMA}`;
        console.log(__DB_STRING, DB_STRING);
        if (_utils_1.default.isUndefinedOrEmpty(__DB_STRING) || __DB_STRING != DB_STRING)
            (0, _logger_1.exitLog)(`Missing or Bad DB_STRING in .env`);
        return {
            NAME: DB_NAME,
            SCHEMA: DB_NAME,
            USER: DB_USER,
            PASS: DB_PASS,
            HOST: DB_HOST,
            DIALECT: DB_DIALECT,
            PORT: DB_PORT,
        };
    }
    parseAWSConfig() {
        const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID;
        if (_utils_1.default.isUndefinedOrEmpty(AWS_ACCESS_KEY_ID))
            (0, _logger_1.exitLog)(`Missing or Bad AWS_ACCESS_KEY_ID in .env`);
        const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY;
        if (_utils_1.default.isUndefinedOrEmpty(AWS_SECRET_ACCESS_KEY))
            (0, _logger_1.exitLog)(`Missing or Bad AWS_SECRET_ACCESS_KEY in .env`);
        const AWS_S3_BUCKET_REGION = process.env.AWS_S3_BUCKET_REGION;
        if (_utils_1.default.isUndefinedOrEmpty(AWS_S3_BUCKET_REGION))
            (0, _logger_1.exitLog)(`Missing or Bad AWS_S3_BUCKET_REGION in .env`);
        const AWS_S3_BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
        if (_utils_1.default.isUndefinedOrEmpty(AWS_S3_BUCKET_NAME))
            (0, _logger_1.exitLog)(`Missing or Bad AWS_S3_BUCKET_NAME in .env`);
        return {
            ACCESS_KEY_ID: AWS_ACCESS_KEY_ID,
            SECRET_ACCESS_KEY: AWS_SECRET_ACCESS_KEY,
            S3_BUCKET_REGION: AWS_S3_BUCKET_REGION,
            S3_BUCKET_NAME: AWS_S3_BUCKET_NAME,
        };
    }
    parseJWTSecret() {
        const __JWT_SECRET = process.env.JWT_SECRET;
        if (_utils_1.default.isUndefinedOrEmpty(__JWT_SECRET))
            (0, _logger_1.exitLog)(`Missing or Bad JWT_SECRET in .env`);
        return __JWT_SECRET;
    }
    parseServerPort() {
        const __serverPort = process.env.SERVER_PORT;
        if (!__serverPort)
            return undefined;
        const port = parseInt(`${__serverPort}`);
        if (isNaN(port))
            (0, _logger_1.exitLog)("Invalid server port");
        return port;
    }
    parseMicroserviceConfig() {
        const MICROSERVICE_HOST = process.env.MICROSERVICE_HOST;
        if (_utils_1.default.isUndefinedOrEmpty(MICROSERVICE_HOST))
            (0, _logger_1.exitLog)(`Missing or Bad MICROSERVICE_HOST in .env`);
        let MICROSERVICE_PORT = 5001;
        const __MICROSERVICE_PORT = process.env.MICROSERVICE_PORT;
        if (!_utils_1.default.isUndefinedOrEmpty(__MICROSERVICE_PORT)) {
            const port = parseInt(`${__MICROSERVICE_PORT}`);
            if (isNaN(port))
                (0, _logger_1.exitLog)(`Bad MICROSERVICE_PORT in .env`);
            MICROSERVICE_PORT = port;
        }
        return {
            MICROSERVICE_HOST: process.env.MICROSERVICE_URL,
            MICROSERVICE_PORT: MICROSERVICE_PORT
        };
    }
    parseLogLevel() {
        let log = "";
        if (!process.env.LOG_LEVEL)
            (0, _logger_1.exitLog)(`Missing LOG_LEVEL in .env`);
        log = process.env.LOG_LEVEL.toUpperCase();
        switch (log) {
            case "DEBUG":
                return log4js_1.levels.DEBUG;
            case "INFO":
                return log4js_1.levels.INFO;
            case "WARN":
                return log4js_1.levels.WARN;
            case "ERROR":
                return log4js_1.levels.ERROR;
            case "FATAL":
                return log4js_1.levels.FATAL;
            case "OFF":
                return log4js_1.levels.OFF;
            case "ALL":
                return log4js_1.levels.ALL;
            default:
                return (0, _logger_1.exitLog)(`Bad LOG_LEVEL in .env`);
        }
    }
}
exports.default = Config.getInstance();
