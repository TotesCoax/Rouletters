import { Logger } from "./Logger.mjs"
import { Player } from "./Player.mjs"

export class PlayerHandler{
    /**
     * @param {Player[]} players - an array of Player objects
     */
    constructor(logFilePath ="./", options = {players:[]}){
        this.TurnLogger = new Logger(logFilePath, "PlayerHandler")
        /** @type {Player[]} */
        this.players = options.players
        this.turnIndicator = 0
    }
    shufflePlayers(){
        for (let i = this.players.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1))
            let temp = this.players[i]
            this.players[i] = this.players[j]
            this.players[j] = temp
        }
        this.TurnLogger.info(`Players have been shuffled`)
    }
    advanceTurn(){
        if(this.turnIndicator + 1 >= this.players.length){
            this.turnIndicator = 0
            return
        }
        this.turnIndicator++
        this.setActivePlayer()
        this.TurnLogger.info(`Turn has been advanced.`)
    }
    retreatTurn(){
        if(this.turnIndicator - 1 <= this.players.length){
            this.turnIndicator = 0
            return
        }
        this.turnIndicator--
        this.setActivePlayer()
        this.TurnLogger.info(`Turn has been retreated`)
    }
    getCurrentPlayer(){
        return this.players[this.turnIndicator]
    }
    setCurrentPlayer(id){
        this.turnIndicator = this.getPlayerIndex(id)
    }
    movePlayerInTurnOrder(){
        //Not Implemented yet, but I think it would be fun to have a wheel space move players around in turn order. Either to specific spots or +/- number of spaces
    }
    swapPlayersInTurnOrder(){
        // Not Implemented yet, but sounds like a fun thing to add
    }
    getNextPlayer(){
        if(!this.players[this.turnIndicator+1]){
            return this.players[0]
        }
        return this.players[this.turnIndicator+1]
    }
    /**
     * Adds a new player class to the array and returns their game ID, to be sent to client for saving.
     * @returns {string} uuid for game session
     */
    addPlayer(gameID, socketID, playerName = `Player ${this.players.length + 1}`){
        if (this.isPlayerExists(gameID)){
            console.log("Player already exists.")
            return
        }
        let newPlayer = new Player(gameID, socketID, playerName)
        this.players.push(newPlayer)
        this.TurnLogger.info(`Added player to game: ${newPlayer.name}`)
        this.TurnLogger.log(`Player Socket ID: ${newPlayer.socketID}`)
        return newPlayer.id
    }
    removePlayer(id){
        if (!this.isPlayerExists(id)){
            console.log("No player found.")
            return []
        }
        let removedPlayer = this.players.splice(this.getPlayerIndex(id), 1)[0]
        this.TurnLogger.info(`Removed player from game: ${removedPlayer.name}`)
        this.TurnLogger.log(`Socket ID: ${removedPlayer.socketID}`)
        return removedPlayer
    }
    isPlayerExists(id){
        this.TurnLogger.log('Checking if player exists.', this.getPlayerIndex(id))
        return this.getPlayerIndex(id) >= 0
    }
    isActivePlayer(id){
        this.TurnLogger.log(`Checking if active player.`)
        return this.getPlayer(id).isActive
    }
    getPlayerIndex(playerId){
        let index = this.players.findIndex(seat => seat.gameID === playerId)
        this.TurnLogger.log(`Search gameID attempt: ${index}`)
        if (index < 0){
            index = this.players.findIndex(seat => seat.socketID === playerId)
            this.TurnLogger.log(`Search socketID attempt: ${index}`)
        }
        if (index < 0){
            index = this.players.findIndex(seat => seat.name === playerId)
            this.TurnLogger.log(`Search name attempt: ${index}`)
        }
        return index
    }
    getPlayer(playerId){
        return this.players[this.getPlayerIndex(playerId)]
    }
    getPlayersSortedByScore(){
        return this.players.toSorted((a, b) => a.totalScore - b.totalScore)
    }
    /**
     * 
     * @param {number} numPlayers Number of players you want returned from top
     */
    getTopPlayers(numPlayers){
        let sorted = this.getPlayersSortedByScore(),
            players = []
        for (let index = 0; players.length < numPlayers; index++) {
            players.push(sorted[index])
        }
        return players
    }
    /**
     * 
     * @param {number} numPlayers Number of players you want returned from top
     */
    getBottomPlayers(numPlayers){
        let sorted = this.getPlayersSortedByScore(),
            players = []
        for (let index = sorted.length - 1; players.length < numPlayers; index--) {
            players.push(sorted[index])
        }
        return players
    }
    resetScoresToZero(){
        this.players.forEach(player => player.setScore(0))
        this.TurnLogger.log(`Scores have been set to zero.`)
    }
    setActivePlayer(){
        if (this.players.length > 0){
            this.players.forEach(player => player.isActive = false)
            this.players[this.turnIndicator].isActive = true
            this.TurnLogger.log(`${this.players[this.turnIndicator].name} is now the active player.`)
        }
    }
}