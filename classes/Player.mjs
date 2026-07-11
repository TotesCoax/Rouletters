
export class Player{
    /**
     * 
     * @param {number} id unique ID for the player 
     */
    constructor(gameID, socketID, defaultName){
        this.gameID = gameID
        this.name = defaultName
        this.score = 0
        this.totalScore = 0
        this.color = '#FFF'
        this.socketID = socketID
        this.isConnected = true
        this.isActive = false
    }
    /**
     * Increments the score for player.
     * @param {number} number Amount to add to score, include "-" to reduce score
     */
    updateScore(number){
        // console.log(`${this.name} score updated ${this.score} to ${this.score + number}`)
        this.score += number
    }
    /**
     * Sets score to a specific number.
     * @param {number} number Amount to set score to.
     */
    setScore(number){
        this.score = number
    }
    /**
     * Assigns a hex code to the player for the board to render a color.
     * @param {string} hex A hexadecimal code for a color, provide by player client.
     */
    setColor(hex){
        this.color = hex
    }
    /**
     * Set a name for the player for the board client to display.
     * @param {string} string 
     */
    setName(string){
        this.name = string
    }
    setConnectedStatus(boolean){
        this.isConnected = boolean
    }
    updateTotalScore(amt){
        this.totalScore += amt
    }
    setTotalScore(amt){
        this.totalScore = amt
    }
    saveRoundScoretoTotalScore(){
        this.totalScore += this.score
    }
    getSocketID(){
        return this.socketID
    }
    setSocketID(id){
        this.socketID = id
    }
}

// module.exports = { Player }