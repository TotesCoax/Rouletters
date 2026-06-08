import { Logger } from "./Logger.mjs"
import { BasicQueue } from "./BasicQueue.mjs"
import { BoardPuzzle } from "./BoardPuzzle.mjs"

/**
 * A queue for Board Puzzles for a game session.
 * @class
 * @extends BasicQueue
 */
export class BoardQueue extends BasicQueue {
    constructor(logfilePath = "./"){
        super()
        this.QueueLogger = new Logger(logfilePath, "Board Queue")
    }
    /**
     * Generates an array to use as a new queue for a game session. Removes the headers from the file too.
     * @param {string[][]} puzzlesArray a two dimensional array from the file.
     * @returns {BoardPuzzle[]}
     */
    parsePuzzleArrayWithHeaders(puzzlesArray){
        let newQueue = []
        for (const puzzle of puzzlesArray) {
            newQueue.push(new BoardPuzzle(puzzle[0],puzzle[1]))
        }
        //Remove the header row
        newQueue.shift()
        this.QueueLogger.info(`New array of puzzles has been parsed.`)
        return newQueue
    }
    /**
     * Adds puzzles to queue
     * @todo Check on the empty checker
     * @param {string[][]} array two dimensional array with headers 
     */
    populateQueue(array){
        // It makes sense to have this empty check, but I'm not sure if it will break anything right now.
        // if (this.isEmpty){
            this.items = this.parsePuzzleArrayWithHeaders(array)
        // } else {
        //     this.items.push(this.parsePuzzleArrayWithHeaders(array))
        // }
        this.QueueLogger.info(`New puzzles have been added to the queue.`)
    }
    /**
     * @returns {BoardPuzzle}
     */
    dequeue(){
        this.QueueLogger.info(`Puzzles has been removed from the queue.`)
        return super.dequeue()
    }
}