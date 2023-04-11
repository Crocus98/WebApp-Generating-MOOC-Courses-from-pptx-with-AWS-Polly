import log4js, { Level } from "log4js"
import { exit } from "process";
// LOG LEVELS:
// ALL < TRACE < DEBUG < INFO < WARN < ERROR < FATAL < MARK < OFF
const fileConfig = {
    type:"file", 
    maxLogSize:8192000, 
    backups:3, 
    compress: true, 
    keepFileExt: true,
    layout: {
        type: 'pattern', 
        pattern: '%d %p %c %m \t(@%f{1}:%l) '
    }
}
const conf = {
    appenders:{
        console:{
            type:"stdout",
            layout: {
                type: 'pattern', 
                // Pattern with: date+time, log level, context, message (@file:line)
                pattern: '%d %[[%c][%p] %m%]\t(@%f{1}:%l)'
            }
        },  
        file:{
            filename:"./logs/default.log", 
            ...fileConfig
        },
        express:{
            filename:"./logs/express.log",
            ...fileConfig
        }
    }, 
    categories:{
        default:{appenders:["console", "file"], level:"all", enableCallStack: true},
        express:{appenders:["console", "express"], level:"all", enableCallStack: true},
    }
}
log4js.configure(conf);
const logger = log4js.getLogger('default');
export const express = log4js.getLogger('express');

export function setAllLoggerLevel(level: Level) {
    logger.level = level
    express.level = level
}

export function exitLog(error: string | Error) : never {
    logger.fatal(error);
    exit(1);
}

// function fastifyLoggerConnect(...args)
/* ------------------------------------------------------------------
    MODULE EXPORTS
-------------------------------------------------------------------*/
export default logger