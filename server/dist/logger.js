"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exitLog = exports.setAllLoggerLevel = exports.express = void 0;
const tslib_1 = require("tslib");
const log4js_1 = tslib_1.__importDefault(require("log4js"));
const process_1 = require("process");
const fileConfig = {
    type: "file",
    maxLogSize: 8192000,
    backups: 3,
    compress: true,
    keepFileExt: true,
    layout: {
        type: 'pattern',
        pattern: '%d %p %c %m \t(@%f{1}:%l) '
    }
};
const conf = {
    appenders: {
        console: {
            type: "stdout",
            layout: {
                type: 'pattern',
                pattern: '%d %[[%c][%p] %m%]\t(@%f{1}:%l)'
            }
        },
        file: Object.assign({ filename: "./logs/default.log" }, fileConfig),
        express: Object.assign({ filename: "./logs/express.log" }, fileConfig)
    },
    categories: {
        default: { appenders: ["console", "file"], level: "all", enableCallStack: true },
        express: { appenders: ["console", "express"], level: "all", enableCallStack: true },
    }
};
log4js_1.default.configure(conf);
const logger = log4js_1.default.getLogger('default');
exports.express = log4js_1.default.getLogger('express');
function setAllLoggerLevel(level) {
    logger.level = level;
    exports.express.level = level;
}
exports.setAllLoggerLevel = setAllLoggerLevel;
function exitLog(error) {
    logger.fatal(error);
    (0, process_1.exit)(1);
}
exports.exitLog = exitLog;
exports.default = logger;
