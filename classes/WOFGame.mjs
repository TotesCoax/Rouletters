// const {Board} = require('./Board.mjs')
// const {Wheel} = require('./Wheel.mjs')
// const {PlayerHandler} = require('./PlayerHandler.mjs')
// const {Letter} = require('./Letter.mjs')
// const { Player } = require('./Player.mjs')

import { Board } from './Board.mjs'
import { Wheel } from './Wheel.mjs'
import { PlayerHandler } from './PlayerHandler.mjs'
import { Letter } from './Letter.mjs'
import { Player } from './Player.mjs'
import { BoardQueue } from './BoardQueue.mjs'
import { Logger } from './Logger.mjs'

export class WOFGame{

    /**
     *  List of turn results
     *  @static
     */
    static TURNRESULT = {
        NOTHING: 0,
        CORRECT: 1,
        INCORRECT: 2,
        SPIN: 3,
        GUESS: 4,
        LOSE: 5,
        BANKRUPT: 6
    }
    /**
     * If no values are provided it makes a default game. Otherwise you can supply values to create a game from a previous game state.
     * @param {Object} options optional params to pass in
     * @param {string} options.clue Clue for the puzzle
     * @param {string} options.phrase Phrase for the puzzle
     * @param {Array} options.sections Sections of the wheel array, mix of numbers and strings
     * @param {Player[]} options.players Array of players
     */
    constructor(logFileDirectory, options){
        /** @type {Logger} */
        this.GameLogger = new Logger(logFileDirectory, "WOFGame")
        /** @type {Board} */
        this.Board = new Board(logFileDirectory, options)
        /** @type {Wheel} */
        this.Wheel = new Wheel(logFileDirectory, options)
        /** @type {PlayerHandler} */
        this.PlayerHandler = new PlayerHandler(logFileDirectory, options)
        /** @type {boolean} */
        this.isWaitingForSpin = false
        /** @type {boolean} */
        this.isWaitingForGuess = false
        /** @type {BoardQueue} */
       this.PuzzleQueue = new BoardQueue(logFileDirectory)
       this.Board.revealAllLetters()
       this.boardSocketID = ""
    }

    // Setup Functions
    /**
     * 
     * @param {string} clue 
     * @param {string} phrase 
     */
    startNewRound(clue, phrase){
        this.GameLogger.info("Starting new round", {tags: ["wof", "gameAction","puzzle"]})
        this.createNewBoard(clue,phrase)
        this.PlayerHandler.resetScoresToZero()
        this.PlayerHandler.setActivePlayer()
        // For now, let's not scale up point values
        this.Wheel.shuffleSections()
    }
    /**
     * 
     * @param {string} clue 
     * @param {string} phrase 
     */
    createNewBoard(clue, phrase){
        this.GameLogger.log("Creating new board", {tags:["wof", "board", "setup"]})
        this.Board = new Board(this.GameLogger.fileDirectory, {clue:clue,phrase:phrase})
    }
    shuffleWheel(){
        this.GameLogger.log("Shuffling wheel sections", {tags:["wof","wheel", "setup"]})
        this.Wheel.shuffleSections()
    }
    enqueuePuzzles(arrayOfCluesAndPuzzles){
        this.GameLogger.log(`Adding puzzles to game queue:\n${this.PuzzleQueue}`, {tags:["wof","puzzle","setup"]})
        this.PuzzleQueue.populateQueue(arrayOfCluesAndPuzzles)
    }
    /**
     * 
     * @returns {WOFGame.turnResult} returns a set turn result value
     */
    nextPuzzle(){
        if (this.PuzzleQueue.isEmpty){
            this.GameLogger.error(`Next puzzle requested when puzzle queue is empty.`)
            return WOFGame.TURNRESULT.NOTHING
        }
        if (this.PlayerHandler.players.length = 0){
            this.GameLogger.error(`Next puzzle requested when there are no active players`)
            return WOFGame.TURNRESULT.NOTHING
        }
        let nextPuzz = this.PuzzleQueue.dequeue()
        this.GameLogger.log(`Next Puzzle requested, upcoming: ${nextPuzz.clue}, ${nextPuzz.puzzle}`, {tags:["wof","gameAction","setup"]})
        this.startNewRound(nextPuzz.clue, nextPuzz.puzzle)
        this.setWaitingForSpin(true)
        return WOFGame.TURNRESULT.SPIN
    }

    // Utility functions
    /**
     * 
     * @param {string} letter 
     * @returns {Letter}
     */
    parseGuess(char){
        this.GameLogger.log(`Processing guess input as letter: ${char}`,{tags:["wof","gameAction","player","gameProcess"]})
        return new Letter(char)
    }



    // Gameplay functions
    /**
     * 
     * @param {string} guess 
     * @param {string} playerID 
     * @returns {WOFGame.turnResult} returns selection of turnResult
     */
    playerGuess(guess, playerID){
        this.GameLogger.log(`${playerID} submitted guess of ${guess}`, {tags:["wof","player","gameAction"]})
        let result = this.handleGuess(guess, playerID)
        return result
    }

    /**
     * 
     * @param {string} guess 
     * @param {Player} player 
     * @returns {WOFGame.turnResult} returns a turn result
     */
    handleGuess(guess, playerID){
        this.GameLogger.info(`Processing guess ${guess} from ${this.PlayerHandler.getPlayer(playerID).name}. Waiting for guess: ${this.isWaitingForGuess}`,{tags:["wof","gameAction","process"]})
        console.log(this)

        //Don't need guesses for a solved board.
        if(this.Board.isSolved){
            this.GameLogger.warn(`Guess was made after board has been solved.`)
            return WOFGame.TURNRESULT.NOTHING
        }

        //I'm not exactly sure when this would trigger... maybe on the first spin?
        if (!this.isWaitingForGuess){
            this.GameLogger.warn(`Guess was made when game is not waiting for a guess.`, {tags:["wof","gameAction"]})
            return WOFGame.TURNRESULT.NOTHING
        }

        let letter = new Letter(guess),
            player = this.PlayerHandler.getPlayer(playerID)

        // If it's not a number, it's gotta be a special space. This won't trigger until I have special spaces that are positive.
        if (Number.isNaN(this.Wheel.getWheelValue())){
            return this.handleSpecialSpace(wheelValue)
        }


        if (letter.isVowel){
            if(this.isWaitingForSpin){
                this.GameLogger.log('Vowel purchase being processed')
                return this.handleVowel(letter, player)
            } else {
                this.GameLogger.warn(`Attempting to guess a vowel after a spin.`)
                return WOFGame.TURNRESULT.GUESS
            }
        }
        if (!this.isWaitingForSpin){
            this.GameLogger.log(`Triggered`)
            if (letter.isLetter||letter.isNumber){
                this.GameLogger.log('Consonant found')
                return this.handleConsonant(letter, player)
            } else {
                this.GameLogger.warn(`Attempting to guess a consonant without spinning.`)
                return WOFGame.TURNRESULT.GUESS
            }

        }
        this.GameLogger.error(`Nothing Fallback triggered.`)
        return WOFGame.TURNRESULT.NOTHING
    }

    /**
     * 
     * @param {string} value 
     * @returns {WOFGame.turnResult}
     */
    handleSpecialSpace(value){
        this.GameLogger.info(`Checking if special space: ${value}`,{tags:["wof","gameAction","process"]})
        switch (value) {
            case 'bankrupt':
                this.PlayerHandler.getCurrentPlayer().setScore(0)
                this.PlayerHandler.advanceTurn()
                this.setWaitingForSpin(true)
                this.setWaitingForGuess(true)
                this.GameLogger.info(`Bankrupt processed.`)
                return WOFGame.TURNRESULT.BANKRUPT
            case 'lose a turn':
                this.PlayerHandler.advanceTurn()
                this.setWaitingForSpin(true)
                this.setWaitingForGuess(true)
                this.GameLogger.info(`Lost a turn processed.`)
                return WOFGame.TURNRESULT.LOSE
            default:
                return WOFGame.TURNRESULT.NOTHING
        }
    }

    /**
     * 
     * @param {Letter} letter 
     * @param {Player} player
     * @returns {WOFGame.turnResult}
     */
    handleConsonant(letter, player){
        this.GameLogger.info(`Consonant processing: ${letter.character}`,{tags:["wof","gameAction","process"]})
        let wheelValue = this.Wheel.getWheelValue(),
            guessResult = this.Board.handleGuess(letter.character)

        if (guessResult <= 0){
            this.GameLogger.info(`No ${letter.character} are in the puzzle.`)
            return WOFGame.TURNRESULT.INCORRECT
        }        
        player.updateScore(wheelValue * guessResult)
        return WOFGame.TURNRESULT.CORRECT
    }

    /**
     * 
     * @param {Letter} letter 
     * @param {Player} player
     * @returns {WOFGame.turnResult}
     */
    handleVowel(letter, player){
        this.GameLogger.info(`Vowel processing: ${letter.character}`,{tags:["wof","gameAction","process"]})
        if (player.score <= 250){
            this.GameLogger.error(`Trying to buy a vowel without enough points.`)
            return WOFGame.TURNRESULT.GUESS
        }

        let guessResult = this.Board.handleGuess(letter.character)

        if (guessResult <= 0){
            this.GameLogger(`No ${letter.character} are in the puzzle.`)
            return WOFGame.TURNRESULT.INCORRECT
        }
        player.updateScore(-250)
        return WOFGame.TURNRESULT.CORRECT
    }

    /**
     * 
     * @returns {{Board: Board, Wheel: Wheel, PlayerHandler: PlayerHandler, isWaitingForGuess: boolean, isWaitingForSpin: boolean}}
     */
    getGamestate(){
        this.GameLogger.log(`Gamestate request rec'd, sending.`,{tags:["wof",""]})
        this.PlayerHandler.setActivePlayer()
        return {
            Board: this.Board,
            Wheel: this.Wheel,
            PlayerHandler: this.PlayerHandler,
            isWaitingForGuess: this.isWaitingForGuess,
            isWaitingForSpin: this.isWaitingForSpin
        }
    }
    /**
     * 
     * @param {number} speedValue 
     */
    spinWheel(speedValue){
        let startingDeg = this.Wheel.getCurrentDeg(),
            initialValue = new String(this.Wheel.getWheelValue()),
            spinPower = this.Wheel.spinWheel(speedValue),
            endingDeg = this.Wheel.getCurrentDeg(),
            wheelIndex = this.Wheel.getWheelIndex(),
            spinData = {start: startingDeg, power: spinPower, end: endingDeg, index: wheelIndex}

        if (spinPower <= 180){
            this.GameLogger.info(`Spin was not strong enough: ${spinPower}`)
            return {result: WOFGame.TURNRESULT.SPIN, spinData: spinData}
        }
        let specialCheck = this.handleSpecialSpace(this.Wheel.getWheelValue())
        if (specialCheck !== WOFGame.TURNRESULT.NOTHING){
            return {result: specialCheck, spinData: spinData}
        }
        this.GameLogger.info(`Wheel spun from ${initialValue} to ${this.Wheel.getWheelValue()}`,{tags:["wof","wheel","gameAction"]})
        return {result: WOFGame.TURNRESULT.SPIN, spinData: spinData}
    }

    solvedPuzzle(){
        this.GameLogger.info(`Puzzle solve processing`,{tags:["wof","gameAction","puzzle","process"]})
        this.Board.revealAllLetters()
        this.PlayerHandler.getCurrentPlayer().saveRoundScoretoTotalScore()
        this.setWaitingForGuess(false)
        this.Board.setIsSolved(true)
        return WOFGame.TURNRESULT.NOTHING
    }

    //Server Related

    getSocketBoardSocketID(){
        return this.boardSocketID
    }

    setSocketBoardSocketID(id){
        this.boardSocketID = id
    }

    handlePlayerDisconnect(socketID){
        try {
            this.GameLogger.log(`${this.PlayerHandler.getPlayer(socketID).name} disconnected`,{tags:["wof","player"]})            
        } catch (error) {
            console.log(error)
            console.log(socketID, this.PlayerHandler.getPlayer(socketID) ,this.PlayerHandler.players)
        }
        if(this.PlayerHandler.getPlayer(socketID)){
            this.PlayerHandler.getPlayer(socketID).setConnectedStatus(false)
            this.GameLogger.log(`Player disconnect processed.`)
        }
    }

    getSocketIDForActivePlayer(){
        this.GameLogger.log(`SocketID requested for ${this.PlayerHandler.getCurrentPlayer().name}`)
        return this.PlayerHandler.getCurrentPlayer().socketID
    }
    /**
     * 
     * @param {boolean} value 
     */
    setWaitingForGuess(value){
        this.isWaitingForGuess = value
        this.GameLogger.log(`Setting waiting for guess to ${value}. Waiting state: Spin ${this.isWaitingForSpin} , Guess ${this.isWaitingForGuess}`)
    }
    /**
     * 
     * @param {boolean} value 
     */
    setWaitingForSpin(value){
        this.isWaitingForSpin = value
        this.GameLogger.log(`Setting waiting for spin to ${value}. Waiting state: Spin ${this.isWaitingForSpin} , Guess ${this.isWaitingForGuess}`)
    }

    createTestEnvironment(){
        console.log('Creating Test players')
        this.PlayerHandler.addPlayer('aaaa', '1111')
        this.PlayerHandler.addPlayer('bbbb', '2222')
        this.PlayerHandler.addPlayer('cccc', '3333')
        this.PlayerHandler.addPlayer('dddd', '4444')
        this.PlayerHandler.addPlayer('eeee', '5555')
        this.PlayerHandler.addPlayer('ffff', '6666')
        console.log('Generating random scores')
        this.PlayerHandler.players.forEach(player => player.setScore(this.Wheel.getRandomValue(1,20)))
        console.log('Applying custom colors')
        this.PlayerHandler.players[0].setColor('#ff0000')
        this.PlayerHandler.players[1].setColor('#89cff0')
        this.PlayerHandler.players[2].setColor('#ee82ee')
        this.PlayerHandler.players[3].setColor('#000')
        this.PlayerHandler.players[4].setColor('#fff')
        this.PlayerHandler.players[5].setColor('#ffa500')
        console.table(this.PlayerHandler.players)
        this.PlayerHandler.players[4].setConnectedStatus(false)
    }


}