import { LocallyConnectedServer } from './classes/LocallyConnectedServer.mjs'
import { v4 as makeID } from 'uuid'
import { EventCode } from './client/classes/EventCode.js'

import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Game imports
import { WOFGame } from './classes/WOFGame.mjs'
import { CSVParser } from './classes/CSVParser.mjs'

// Utility Imports
import { Logger } from './classes/Logger.mjs'

async function main(){

    const LogDirectory = `./logs/`
    const ServerLogger = new Logger(LogDirectory, "Server")
    
    const GameServer = new LocallyConnectedServer('client')
    
    // Socket IO Server Stuff
    GameServer.io.on(EventCode.connection, (socket) => {
        ServerLogger.log(`New connection ${socket.id}`, {tags: ["connect", "socketIO"]})
        socket.on(EventCode.disconnect, (reason) => {
            ServerLogger.log(`${WOF.PlayerHandler.getPlayer(socket.id)} disconnected ${reason} ${socket.id}`, {tags: ["disconnect", "socketIO"]})
            WOF.handlePlayerDisconnect(socket.id)
            changeNotificationToBoard()
        })
        // Board Events
        // The Board connects to the server
        socket.on(EventCode.boardJoin, (id, callback) =>{
            // The Board gets assigned to a room for the board only.
            socket.join('board')
            ServerLogger.info(`Board joined board room`, {tags: ["join", "socketIO", "board", "client"]})
            // Confirm with the board that it has been assigned the room.
            callback('Room joined')
        })
        // The Board requests a gamestate, usually after a refresh or disconnect event.
        socket.on(EventCode.gamestateRequest, (id, callback) => {
            ServerLogger.info(`Board request from: ${id}`, {tags: ["gameAction", "socketIO"]})
            // The server sends a copy of the game state to the board.
            callback(WOF.getGamestate())
        })
        // Solve the puzzle
        socket.on('revealPuzzle', () => {
            ServerLogger.info(`Puzzle reveal request`, {tags: ["gameAction", "socketIO"]})
            WOF.solvedPuzzle()
            changeNotificationToBoard()
        })
        // Direct to player message
        function notificationToActivePlayer(){
            if (WOF.PlayerHandler.players.length <= 0){
                return
            }
            ServerLogger.info(`Sending turn notice to ${WOF.PlayerHandler.getPlayer(socket.id)}`)
            let currentPlayer = WOF.getSocketIDForActivePlayer()
            socket.to(currentPlayer).emit('yourTurn', "You're up, dingus")
        }
        // Notice to Board screen that a change has occured and needs to rerender.
        function changeNotificationToBoard(){
            ServerLogger.log(`Boardstate change. Sending data to board.`, {tags: ["gameAction", "socketIO"]})
            GameServer.io.to('board').emit('playerUpdate', WOF.getGamestate())
        }
    
        socket.on(EventCode.letterSubmission, (data) => {
            ServerLogger.info(`${data, WOF.PlayerHandler.getCurrentPlayer().name}'s guess: ${data}`, {tags:["gameAction", "socketIO"]})
            WOF.playerGuess(data, WOF.PlayerHandler.getCurrentPlayer().gameID)
            changeNotificationToBoard()
            notificationToActivePlayer()
            WOF.setWaitingForSpin(true)
        })
    
        socket.on('gameFile', (data) => {
            ServerLogger.log(`File received from board. \n${data}\n`, {tags: ["file", "socketIO"]})
            WOF.PuzzleQueue.populateQueue(CSVParser.csvToArray(data))
            WOF.createNewBoard('Puzzles Loaded', "Press next round to begin!")
            WOF.Board.revealAllLetters()
            changeNotificationToBoard()
            notificationToActivePlayer()
        })
    
        socket.on('nextRound', (data) => {
            ServerLogger.info(`Next round requested ${data}`, {tags: ["gameAction", "socketIO"]})
            WOF.nextPuzzle()
            changeNotificationToBoard()
            notificationToActivePlayer()
            WOF.setWaitingForSpin(true)
        })
    
        //Manual Mode
        socket.on('manualAdd', (data) => {
            ServerLogger.log(`Adding new player manually: ${data}`, {tags: ["gameAction", "socketIO"]})
            WOF.PlayerHandler.addPlayer(data, 'manual')
            WOF.PlayerHandler.getPlayer(data).setName(data)
            changeNotificationToBoard()
        })
    
        socket.on('manualRemove', (data) => {
            ServerLogger.log(`Removing player manually: ${data}`, {tags: ["gameAction", "socketIO"]})
            let removed = WOF.PlayerHandler.removePlayer(data)
            changeNotificationToBoard()
        })
    
        socket.on('offlineSpin', (data) => {
            ServerLogger.log(`Offline Spin received ${data}`, {tags: ["gameAction", "test", "socketIO"]})
            let spinValue = (WOF.Wheel.getRandomValue(5, 40)/100)
            let spinData =WOF.spinWheel(spinValue)
            GameServer.io.to('board').emit('wheelSpin', spinData)
        })
    
        // Player Events
        // A Player connects to the server
        socket.on(EventCode.playerJoin, (id, callback) =>{
            ServerLogger.info(`Player Join: ${id}`, {tags:["gameAction", "player"]})
            if (!WOF.PlayerHandler.isPlayerExists(id)){
                // If the player does not exist in the player list, aka truly new player, create a new ID for them, add it to the list, and return the ID to the client for identity storage.
                ServerLogger.log(`Creating new player.`, {tags:["gameSetup", "player"]})
                let newPlayerID = makeID()
                WOF.PlayerHandler.addPlayer(newPlayerID, socket.id)
                changeNotificationToBoard()
                callback(WOF.PlayerHandler.getPlayer(newPlayerID))
            } else {
                // If the player exists, send them their player ID to confirm connection.
                ServerLogger.info(`Player reconnect detected: ${WOF.PlayerHandler.getPlayer(id)}`, {tags: ["gameAction", "player"]})
                WOF.PlayerHandler.getPlayer(id).setConnectedStatus(true)
                changeNotificationToBoard()
                callback(WOF.PlayerHandler.getPlayer(id))
                if (WOF.PlayerHandler.isActivePlayer(id)){
                    notificationToActivePlayer()
                }
            }
            // Add them to the players channel
            socket.join('players')
            ServerLogger.log(`Player joined room \n${WOF.PlayerHandler.players}`)
        })
        // A player sends spin data to the server
        socket.on(EventCode.speedData, (data) => {
            ServerLogger.log(`Spin data from player: ${data} Waiting for guess: ${WOF.isWaitingForGuess} Waiting for spin: ${WOF.isWaitingForSpin}`, {tags:["gameAction", "player"]})
            // Check if the player is the active player, ignore all other submissions (let the players have freedom to fiddle with it)
            if(WOF.PlayerHandler.isActivePlayer(data.id)){
                if(!WOF.isWaitingForSpin){
                    return
                }
                let spinData = WOF.spinWheel(data.value)
                GameServer.io.to('board').emit('wheelSpin', spinData)
                if(spinData.power <= 180){
                    WOF.setWaitingForSpin(true)
                    WOF.setWaitingForGuess(false)
                } else {
                    WOF.setWaitingForSpin(false)
                    WOF.setWaitingForGuess(true)
                }
            }
        })
    
        socket.on('spinAnimEnded', (data) => {
            ServerLogger.log(`Spin animation ended`, {tags:["gameAction", "board"]})
            if(WOF.isWaitingForGuess && !WOF.isWaitingForSpin){
                socket.to('board').emit('guessReady', 'Ready for a guess input')
                return
            }
            notificationToActivePlayer()
        })
    
        socket.on(EventCode.nameChange, (data) => {
            ServerLogger.log(`Player name change request: ${data.name}`)
            let player = WOF.PlayerHandler.getPlayer(data.id)
            player.setName(data.name)
            changeNotificationToBoard()
        })
        socket.on(EventCode.colorChange, (data) => {
            ServerLogger.log(`Player color change request: ${data.color}`)
            let player = WOF.PlayerHandler.getPlayer(data.id)
            player.setColor(data.color)
            changeNotificationToBoard()
        })
        // Game Actions
        
    })
    
    
    // Serving the HTML Files
    GameServer.app.get('/player', (req, res) => {
        ServerLogger.log(`Sending player screen html`, {tags: ["file", "web"]})
        res.sendFile(__dirname + '/client/playerScreen.html')
    })
    
    GameServer.app.get('/board', (req, res) => {
        ServerLogger.log(`Sending board screen html`, {tags: ["file", "web"]})
        res.sendFile(__dirname + '/client/mainScreen.html')
    })
    
    // Spin up the server
    GameServer.server.listen(3000, () => {
        ServerLogger.log(`Starting server`, {tags: ["server", "startUp"]})
        const addressInfo = GameServer.server.address()
        GameServer.generateQRCodeForServer(addressInfo.port, 'player')
    })
    
    ServerLogger.log(`Starting instance of game`, {tags:["gameAction"]})
    const WOF = new WOFGame()
}

main()