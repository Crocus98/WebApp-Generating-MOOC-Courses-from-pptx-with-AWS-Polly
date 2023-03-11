import log4js from "log4js"
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
        }
    }, 
    categories:{
        default:{appenders:["console", "file"], level:"all", enableCallStack: true},
    }
}
log4js.configure(conf);
const logger = log4js.getLogger('default');
export function exitLog(error: string | Error) : never {
    logger.fatal(error);
    exit(1);
}
/* ------------------------------------------------------------------
    MODULE EXPORTS
-------------------------------------------------------------------*/
export default logger