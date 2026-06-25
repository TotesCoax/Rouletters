// const {Letter} = require('./Letter.mjs')
import { Letter } from './Letter.mjs'
import { Logger } from './Logger.mjs'

export class Board{
    /**
     * @param {string} clue Clue to display to players
     * @param {string} phrase The Phrase the players need to solve
     */
    constructor(logFilePath = "./", options = {clue:"Have fun!", phrase:"Welcome to Rouletters!"}){
        this.BoardLogger = new Logger(logFilePath, "Board")
        this.rowCount = 4
        this.colCount = 12
        this.maxChar = this.rowCount * this.colCount
        this.phrase = options.phrase.trim().toUpperCase()
        this.tooManyChars()
        this.board = this.generateBoard()
        this.racks = this.rackRows(this.phrase)
        this.populateBoard(this.racks)
        this.guessedLetters = []
        this.clue = options.clue
        this.isSolved = false
    }
    /**
     * Checks if phrase is too long to parse into the board.
     */
    tooManyChars(){
        if(this.phrase > this.maxChar){
            this.BoardLogger.warn(`This phrase is too large to fit the board.`)
        }
    }
    /**
     * 
     * @param {string} words 
     * @returns {string[]}
     */
    splitByWord(words){
        this.BoardLogger.log(`Splitting phrase into array of words, space delimited.`)
        return words.trim().split(' ')
    }
    /**
     * Generates a black board full of Letter objects. 
     * @returns {Letter[][]}
     */
    generateBoard(){
        this.BoardLogger.log(`Generating blank board spaces.`)
        let board = []
        for (let index = 0; index < this.rowCount; index++) {
            let col = []
            for (let index = 0; index < this.colCount; index++) {
                let blankSpace = new Letter(" ")
                col.push(blankSpace)                
            }
            board.push(col)            
        }
        return board
    }
    /**
     * Parses the phrase into letters, and formats it so it fits words onto each row with no breaking.
     * @returns {string[]}
     */
    rackRows(){
        this.BoardLogger.log(`Beginning racking of rows.`)
        let words = this.splitByWord(this.phrase),
            rack = '',
            rows = []
        for (let i = 0; i < words.length; i++) {
            // check if next word would break past column count. if yes push to return array and reset otherwise continue
            if(rack.length + words[i].length >= this.colCount){
                rows.push(rack)
                rack = ''
            }
            // add word, trim space if first word
            rack = rack.concat(" ", words[i]).trim()
        }
        // Pushes last rack
        rows.push(rack)
        this.BoardLogger.info(`Rows have been racke for puzzle.`)
        return rows
    }
    /**
     * Finds which index to start on each row, roughly centering the row of letters.
     * @param {stringtring[]} row 
     * @returns {number} 
     */
    findStartingSpot(row){
        this.BoardLogger.log(`Calculating starting spot for letter placement.`)
        return Math.round((this.colCount - row.length)/2)
    }
    /**
     * 
     * @param {Letter[]} rowFromBoard Row from the generated board to be filled.
     * @param {string[]} parsedRow Array of parsed/racked letters to apply to board.
     */
    assignLettersToRow(rowFromBoard, parsedRow){
        this.BoardLogger.log(`Assigning letters to row.`)
        let index = this.findStartingSpot(parsedRow)
        for (let letter of parsedRow) {
            rowFromBoard[index] = new Letter(letter)
            index++
        }
    }
    /**
     * Fills the generated board with parsed letters. It's not dynamic right now, but I would need to overhaul quite a bit to handle more than 4 rows.
     * @param {string[]} rackedRows 
     */
    populateBoard(rackedRows){
        switch (rackedRows.length) {
            case 1:
                this.assignLettersToRow(this.board[1], rackedRows[0])
                break;
            case 2:
                this.assignLettersToRow(this.board[1], rackedRows[0])
                this.assignLettersToRow(this.board[2], rackedRows[1])
                break;
            case 3:
                this.assignLettersToRow(this.board[0], rackedRows[0])
                this.assignLettersToRow(this.board[1], rackedRows[1])
                this.assignLettersToRow(this.board[2], rackedRows[2])
                break;
            case 4:
                this.assignLettersToRow(this.board[0], rackedRows[0])
                this.assignLettersToRow(this.board[1], rackedRows[1])
                this.assignLettersToRow(this.board[2], rackedRows[2])
                this.assignLettersToRow(this.board[3], rackedRows[3])
                break;
        
            default:
                throw `Failed to populate`
        }
        this.BoardLogger.info(`Board has been populated`)
    }
    /**
     * Handles guesses and also buying of vowels.
     * For guesses, times returned number by the wheel amount, for vowels subtract cost of vowels.
     * @param {string} letter
     * @returns {number} number of found letters or -1 if letter is already guessed.
     */
    handleGuess(letter){
        this.BoardLogger.log(`Processing guess for: ${letter}`)
        let guessLetter = letter.toUpperCase()
        if(this.letterAlreadyGuessed(guessLetter)){
            console.log("Letter already guessed.")
            return -1
        }
        this.guessedLetters.push(guessLetter)
        let numFoundLetters = 0
        for (const row of this.board) {
            for (const letter of row) {
                if(guessLetter === letter.character){
                    letter.revealLetter()
                    numFoundLetters++
                }
            }
        }
        this.BoardLogger.info(`Letters found: ${numFoundLetters} ${this.guessedLetters}'s`)
        return numFoundLetters
    }
    /**
     * 
     * @param {string} guessLetter 
     * @returns {boolean} Whether or not the letter is recorded in the guessed letters array.
     */
    letterAlreadyGuessed(guessLetter){
        this.BoardLogger.log(`Checking if ${guessLetter} has already been guessed.`)
        return this.guessedLetters.findIndex(letter => letter === guessLetter) >= 0
    }
    revealAllLetters(){
        this.board.forEach(row => {
            row.forEach(space =>{
                if (space.isSpace){
                    space.revealLetter()
                }
            })
        })
        this.BoardLogger.info(`Board has been revealed`)
    }
    /**
     * 
     * @param {boolean} value 
     */
    setIsSolved(value){
        this.isSolved = value
    }
}

// module.exports = { Board }