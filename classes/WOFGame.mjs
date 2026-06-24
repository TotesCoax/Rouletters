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
    nextPuzzle(){
        let nextPuzz = this.PuzzleQueue.dequeue()
        this.GameLogger.log(`Next Puzzle requested, upcoming: ${nextPuzz.clue}, ${nextPuzz.puzzle}`, {tags:["wof","gameAction","setup"]})
        this.startNewRound(nextPuzz.clue, nextPuzz.puzzle)
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
     * @returns {Player} returns Player object of current turn's player
     */
    playerGuess(guess, playerID){
        this.GameLogger.log(`${playerID} submitted guess of ${guess}`, {tags:["wof","player","gameAction"]})
        let result = this.handleGuess(guess, playerID)
        if(!result){
            this.PlayerHandler.advanceTurn()
        }
        return this.PlayerHandler.getCurrentPlayer()
    }

    /**
     * 
     * @param {string} guess 
     * @param {Player} player 
     * @returns {boolean} true if successful, false if not
     */
    handleGuess(guess, playerID){
        this.GameLogger.info(`Processing guess ${guess} from ${this.PlayerHandler.getPlayer(playerID).name}`,{tags:["wof","gameAction","process"]})
        let letter = new Letter(guess),
            player = this.PlayerHandler.getPlayer(playerID)

        if (Number.isNaN(this.Wheel.getWheelValue())){
            this.handleSpecialSpace(wheelValue)
            return false
        }


        if (letter.isVowel){
            this.GameLogger.log('Vowel found')
            return this.handleVowel(letter, player)
        }
        if (letter.isLetter||letter.isNumber){
            this.GameLogger.log('Consonant found')
            return this.handleConsonant(letter, player)
        }
        return false
    }

    handleSpecialSpace(value){
        this.GameLogger.info(`Checking if special space: ${value}`,{tags:["wof","gameAction","process"]})
        switch (value) {
            case 'bankrupt':
                this.PlayerHandler.getCurrentPlayer().setScore(0)
                this.PlayerHandler.advanceTurn()
                this.setWaitingForSpin(true)
                break;
            case 'lose a turn':
                this.PlayerHandler.advanceTurn()
                this.setWaitingForSpin(true)
                break;
        
            default:
                break;
        }
    }

    /**
     * 
     * @param {Letter} letter 
     * @param {Player} player 
     */
    handleConsonant(letter, player){
        this.GameLogger.info(`Consonant processing: ${letter.character}`,{tags:["wof","gameAction","process"]})
        let wheelValue = this.Wheel.getWheelValue(),
            guessResult = this.Board.handleGuess(letter.character)

        if (guessResult <= 0){
            return false
        }        
        player.updateScore(wheelValue * guessResult)
        return true
    }

    /**
     * 
     * @param {Letter} letter 
     * @param {Player} player 
     */
    handleVowel(letter, player){
        this.GameLogger.info(`Vowel processing: ${letter.character}`,{tags:["wof","gameAction","process"]})
        if (player.score <= 250){
            return false
        }

        let guessResult = this.Board.handleGuess(letter.character)

        if (guessResult <= 0){
            return false
        }
        player.updateScore(-250)
        return true
    }

    /**
     * 
     * @returns {{Board: Board, Wheel: Wheel, PlayerHandler: PlayerHandler}}
     */
    getGamestate(){
        this.GameLogger.log(`Gamestate request rec'd, sending.`,{tags:["wof",""]})
        this.PlayerHandler.setActivePlayer()
        return {
            Board: this.Board,
            Wheel: this.Wheel,
            PlayerHandler: this.PlayerHandler
        }
    }
    /**
     * 
     * @param {number} speedValue 
     * @returns {{start: number, power: number, end: number, index: number}}
     */
    spinWheel(speedValue){
        let startingDeg = this.Wheel.getCurrentDeg(),
            spinPower = this.Wheel.spinWheel(speedValue),
            endingDeg = this.Wheel.getCurrentDeg(),
            wheelIndex = this.Wheel.getWheelIndex(),
            initialValue = new String(this.Wheel.getWheelValue())
        
        this.handleSpecialSpace(this.Wheel.getWheelValue())
        let spinData = {start: startingDeg, power: spinPower, end: endingDeg, index: wheelIndex}
        this.GameLogger.info(`Wheel spun from ${initialValue} to ${this.Wheel.getWheelValue()}`,{tags:["wof","wheel","gameAction"]})
        return spinData
    }

    solvedPuzzle(){
        this.GameLogger.info(`Puzzle solve processing`,{tags:["wof","gameAction","puzzle","process"]})
        this.Board.revealAllLetters()
        this.PlayerHandler.getCurrentPlayer().saveRoundScoretoTotalScore()
    }

    //Server Related

    handlePlayerDisconnect(socketID){
        this.GameLogger.log(`${this.PlayerHandler.getPlayer(socketID)} disconnected`,{tags:["wof","player"]})
        if(this.PlayerHandler.getPlayer(socketID)){
            this.PlayerHandler.getPlayer(socketID).setConnectedStatus(false)
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
        this.GameLogger.log(`Setting waiting for guess status.`)
        this.isWaitingForGuess = value
    }
    /**
     * 
     * @param {boolean} value 
     */
    setWaitingForSpin(value){
        this.GameLogger.log(`Setting waiting for guess status.`)
        this.isWaitingForSpin = value
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