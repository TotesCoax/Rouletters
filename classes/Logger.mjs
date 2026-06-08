import fs from 'fs/promises'

/**
 * A basic logger that writes to console and file with the same actions. Mimics log, info, warn, and error of console.
 */
export class Logger {

    static LEVELS = {
        DEBUG: 0,
        INFO: 1,
        WARN: 2,
        ERROR: 3
    }

    static LoggingLevel = Logger.LEVELS.DEBUG
    /**
     * 
     * @param {string} filePath path to the logger file directory you want to log to. If none is provided it will create a file in the same folder as the class as a fallback.
     * @param {string} context this will add a label in the logger to provide origin context to the line.
     * @param {"DEBUG"|"INFO"|"WARN"|"ERROR"} desiredLogLevel indicate the minimum level of logging you want printed
     */
    constructor(filePath = "./", context = "unassigned"){
        let now = new Date(Date.now())
        /** @type {string} */
        this.fileDirectory = filePath
        /** @type {string} */
        this.filePath = `${filePath}\\${this.getCurrentDateTimeFormatted().date}.txt`
        /** @type {string} */
        this.context = context
        this.log(`New Logger for ${context} saving to ${this.filePath}`, {tags:["NewSession","setup"]})
    }
    /**
     * Method to get date and time based on current time. Use returned object properties to get uniform formatting.     * 
     */
    getCurrentDateTimeFormatted(){
        let now = new Date(Date.now())
        
        return {
            date: `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`,
            time: `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`
        }
    }

    /**
     * @typedef LoggingOptions
     * @prop {string[]} tags
     */

    /**
     * @param {string} msg
     * @param {LoggingOptions} options optional flags for logging
     */
    async log(msg, options){
        let line = `** LOG ** ${await this._generateLine(msg, options)}`
        this._write(line)
        if (Logger.LoggingLevel <= Logger.LEVELS.DEBUG){
            console.log(line)
        }
    }
    /**
     * @param {string} msg
     * @param {Object} options optional flags for logging
     * @param {LoggingOptions} options.tags tags to help aggregate or search
     */
    async info(msg, options){
        let line = `** INFO ** ${await this._generateLine(msg, options)}`
        this._write(line)
        if (Logger.LoggingLevel <= Logger.LEVELS.INFO){
            console.info(line)
        }
    }
    /**
     * @param {string} msg
     * @param {Object} options optional flags for logging
     * @param {LoggingOptions} options.tags tags to help aggregate or search
     */
    async warn(msg, options){
        let line = `** WARN ** ${await this._generateLine(msg, options)}`
        this._write(line)
        if (Logger.LoggingLevel <= Logger.LEVELS.WARN){
            console.warn(line)
        }
    }
    /**
     * @param {string} msg
     * @param {Object} options optional flags for logging
     * @param {LoggingOptions} options.tags tags to help aggregate or search
     */
    async error(msg, options){
        let line = `** ERROR ** ${await this._generateLine(msg, options)}`
        this._write(line)
        if (Logger.LoggingLevel <= Logger.LEVELS.ERROR){
            console.error(line)
        }
    }

    /**
     * A function to generate a standardized message for the logger.
     * @param {string} msg 
     * @param {LoggingOptions} options 
     * @returns {string}
     */
    async _generateLine(msg = "", options = {tags:[]}){
        let line = `${this.getCurrentDateTimeFormatted().time} => ${this.context}: ${msg}`
        if (options.tags && options.tags.length > 0){
            for (const tag of options.tags) {
                line = line.concat(" #", tag)
            }
        }
        return line.concat("\n")
    }

    async _write(msg){
        try {
            await fs.appendFile(this.filePath, msg)
        } catch (err) {
            console.error("File not upated", err)
        }
    }

    static getLoggingLevel(){
        console.log(`Currently logging at: ${Logger.LoggingLevel}`)
        return Logger.LoggingLevel
    }
    /**
     * Set the logging level of the logger.
     * @param {"DEBUG"|"INFO"|"WARN"|"ERROR"} targetLevel 
     */
    static setLoggingLevel(targetLevel){
        if(targetLevel in Logger.LEVELS){
            Logger.LoggingLevel = Logger.LEVELS[targetLevel]
        }
    }


}