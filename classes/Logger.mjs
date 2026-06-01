import { appendFile } from 'fs/promises'

/**
 * A basic logger that writes to console and file with the same actions. Mimics log, info, warn, and error of console.
 * @class
 */
class Logger {

    constructor(){
        let now = new Date(Date.now());
        this.fileName = this.getDateFormatted().date
        appendFile(`../logs/${this.fileName}`, `${this.getDateFormatted().time} => New Logging Session Started`)
    }

    /**
     * Method to get date and time based on current time. Use returned object properties to get uniform formatting.     * 
     */
    getDateFormatted(){
        let now = new Date(Date.now()),
        
        return {
            date: `${now.getFullYear()}-${now.getMonth() + 1}-${now.getDate()}`,
            time: `${now.getHours}:${now.getMinutes}:${now.getSeconds}`
        }
    }
    /**
     * 
     * @param {string} context name of the method or context label of thing you want to log 
     * @param {string} msg string of the message you'd like to add to the log
     */
    log(context = "unassigned", msg = ""){
        let line = `${this.getDateFormatted().time} => ${context}: ${msg}`
        console.log(line)
        appendFile(this.fileName, `** LOG ** ${line}`)
    }
    /**
     * 
     * @param {string} context name of the method or context label of thing you want to log 
     * @param {string} msg string of the message you'd like to add to the log
     */
    info(context = "unassigned", msg = ""){
        let line = `I${this.getDateFormatted().time} => ${context}: ${msg}`
        console.info(line)
        appendFile(this.fileName, `** INFO ** ${line}`)
    }
    /**
     * 
     * @param {string} context name of the method or context label of thing you want to log 
     * @param {string} msg string of the message you'd like to add to the log
     */
    warn(context = "unassigned", msg = ""){
        let line = `${this.getDateFormatted().time} => ${context}: ${msg}`
        console.warn(line)
        appendFile(this.fileName, `** WARN ** ${line}`)
    }
    /**
     * 
     * @param {string} context name of the method or context label of thing you want to log 
     * @param {string} msg string of the message you'd like to add to the log
     */
    error(context = "unassigned", msg = ""){
        let line = `${this.getDateFormatted().time} => ${context}: ${msg}`
        console.error(line)
        appendFile(this.fileName, `** ERROR ** ${line}`)
    }


}