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

    const LogDirectory = path.resolve("./logs/")
    const ServerLogger = new Logger(LogDirectory, "Server")
    
    const GameServer = new LocallyConnectedServer('client')
    
    // Socket IO Server Stuff
    GameServer.io.on(EventCode.connection, (socket) => {
        ServerLogger.log(`New connection ${socket.id}`, {tags: ["connect", "socketIO"]})
        socket.on(EventCode.disconnect, (reason) => {
            ServerLogger.log(`${WOF.PlayerHandler.getPlayer(socket.id)} disconnected ${reason} ${socket.id}`, {tags: ["disconnect", "socketIO"]})
            if(socket.id !== WOF.getSocketBoardSocketID()){
                ServerLogger.log(`Board socket check: ${socket.id == WOF.getSocketBoardSocketID} Socket: ${socket.id}  File: ${WOF.getSocketBoardSocketID}`)
                WOF.handlePlayerDisconnect(socket.id)
            }
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
            // If this is on, the logs get flooded from every player update.
            // ServerLogger.info(`Board request from: ${id}`, {tags: ["gameAction", "socketIO"]})
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
        function notificationToActivePlayer(eventCode = WOFGame.TURNRESULT.NOTHING){
            if (WOF.PlayerHandler.players.length <= 0){
                return
            }
            ServerLogger.info(`Sending turn notice to ${WOF.PlayerHandler.getPlayer(WOF.getSocketIDForActivePlayer()).name}`)
            let currentPlayer = WOF.getSocketIDForActivePlayer()
            socket.to(currentPlayer).emit(WOFGame.TURNRESULT.SPIN)
        }
        // Notice to Board screen that a change has occured and needs to rerender.
        function changeNotificationToBoard(){
            ServerLogger.log(`Boardstate change. Sending data to board.`, {tags: ["gameAction", "socketIO"]})
            GameServer.io.to('board').emit('playerUpdate', WOF.getGamestate())
        }
    
        socket.on(EventCode.letterSubmission, (data) => {
            ServerLogger.info(`${data, WOF.PlayerHandler.getCurrentPlayer().name}'s guess: ${data}`, {tags:["gameAction", "socketIO"]})
            let result = WOF.playerGuess(data, WOF.PlayerHandler.getCurrentPlayer().gameID)
            switch (result) {                   
                case WOFGame.TURNRESULT.NOTHING:
                    break;
                case WOFGame.TURNRESULT.CORRECT:
                    break;
                case WOFGame.TURNRESULT.GUESS:
                    break;
                case WOFGame.TURNRESULT.SPIN:
                    break;
                case WOFGame.TURNRESULT.INCORRECT:
                    break;
                case WOFGame.TURNRESULT.LOSE:
                    break;
                case WOFGame.TURNRESULT.BANKRUPT:
                    break;            
                default:
                    break;
                }
                changeNotificationToBoard()
                notificationToActivePlayer(result)
        })
    
        socket.on('gameFile', (data) => {
            ServerLogger.log(`File received from board. \n${data}\n`, {tags: ["file", "socketIO"]})
            WOF.PuzzleQueue.populateQueue(CSVParser.csvToArray(data))
            WOF.createNewBoard("Puzzles Loaded", "Press next round to begin!")
            WOF.Board.revealAllLetters()
            changeNotificationToBoard()
            notificationToActivePlayer(WOFGame.TURNRESULT.SPIN)
        })
    
        socket.on('nextRound', (data) => {
            ServerLogger.info(`Next round requested ${data}`, {tags: ["gameAction", "socketIO"]})
            let result = WOF.nextPuzzle()
            if (result === WOFGame.TURNRESULT.NOTHING){
                ServerLogger.error(`Next round requested with no puzzles in queue.`)
            }
            changeNotificationToBoard()
            notificationToActivePlayer(result)
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

        socket.on('setScore', (data) =>{
            let playerName = data.name,
                targetScore = data.score,
                targetPlayer = WOF.PlayerHandler.getPlayer(playerName)

            targetPlayer.setScore(targetScore)
            changeNotificationToBoard()
        })
        
        socket.on('setActive', (data) =>{
            // It has to be done this way until I refactor the setActivePlayer function.
            let playerIndex = WOF.PlayerHandler.getPlayerIndex(data)
            WOF.PlayerHandler.turnIndicator = playerIndex
            WOF.PlayerHandler.setActivePlayer()
            changeNotificationToBoard()
        })

        socket.on('offlineSpin', (data) => {
            ServerLogger.log(`Offline Spin received ${data}`, {tags: ["gameAction", "test", "socketIO"]})
            let spinValue = (WOF.Wheel.getRandomValue(5, 40)/100)
            serverSpin({id: WOF.PlayerHandler.getCurrentPlayer().gameID, value: spinValue})
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
                ServerLogger.info(`Player reconnect detected: ${WOF.PlayerHandler.getPlayer(id).name}`, {tags: ["gameAction", "player"]})
                WOF.PlayerHandler.getPlayer(id).setSocketID(socket.id)
                WOF.PlayerHandler.getPlayer(id).setConnectedStatus(true)
                changeNotificationToBoard()
                callback(WOF.PlayerHandler.getPlayer(id))
                if (WOF.PlayerHandler.isActivePlayer(id)){
                    notificationToActivePlayer(WOFGame.TURNRESULT.NOTHING)
                }
            }
            // Add them to the players channel
            socket.join('players')
            ServerLogger.log(`Player joined players room`)
        })
        // A player sends spin data to the server
        socket.on(EventCode.speedData, (data) => {
            ServerLogger.log(`Speeddata rec'd from ${WOF.PlayerHandler.getPlayer(socket.id)}: ${data}`)
            serverSpin(data)
        })

        /**
         * Function that handles the spin mechanics so I can do normal and manual spins the same.
         * @param {Object}} data packet from slient
         * @prop {string} data.id player id
         * @prop {number} data.value spin value
         */
        function serverSpin(data){
            if(!WOF.isWaitingForSpin){
                ServerLogger.log(`Game is not waiting for spin value.`)
                return
            }
            ServerLogger.log(`Spin data from player: ${data} Waiting for guess: ${WOF.isWaitingForGuess} Waiting for spin: ${WOF.isWaitingForSpin}`, {tags:["gameAction", "player"]})
            // Check if the player is the active player, ignore all other submissions (let the players have freedom to fiddle with it)
            if(WOF.PlayerHandler.isActivePlayer(data.id)){
                let spinResult = WOF.spinWheel(data.value)
                switch (spinResult.result) {
                    case WOFGame.TURNRESULT.BANKRUPT:
                        notificationToActivePlayer(WOFGame.TURNRESULT.SPIN)
                        break
                    case WOFGame.TURNRESULT.LOSE:
                        notificationToActivePlayer(WOFGame.TURNRESULT.SPIN)
                        break
                    case WOFGame.TURNRESULT.SPIN:
                        ServerLogger.warn(`Spin was not strong enough.`)
                        notificationToActivePlayer(spinResult.result)
                        break
                    default:
                        ServerLogger.log(`Did not land on a special space.`)
                    }
                    GameServer.io.to('board').emit('wheelSpin', spinResult.spinData)
            }
        }
    
        socket.on('spinAnimEnded', (data) => {
            ServerLogger.log(`Spin animation ended`, {tags:["gameAction", "board"]})
            if(WOF.isWaitingForGuess && !WOF.isWaitingForSpin){
                socket.to('board').emit('guessReady', 'Ready for a guess input')
                return
            }
            notificationToActivePlayer(WOFGame.TURNRESULT.GUESS)
        })
    
        socket.on(EventCode.nameChange, (data) => {
            ServerLogger.log(`Player name change request: ${data.name}`)
            try {
                let player = WOF.PlayerHandler.getPlayer(data.id)
                player.setName(data.name)
                changeNotificationToBoard()                
            } catch (error) {
                ServerLogger.error(`Name change update failed: ${error}`)
            }
        })
        socket.on(EventCode.colorChange, (data) => {
            ServerLogger.log(`Player color change request: ${data.color}`)
            try {
                let player = WOF.PlayerHandler.getPlayer(data.id)
                player.setColor(data.color)
                changeNotificationToBoard()                
            } catch (error) {
                ServerLogger.error(`Color change update failed: ${error}`)
            }
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
    Logger.setLoggingLevel('INFO')
    Logger.getLoggingLevel()
    const WOF = new WOFGame(LogDirectory)
}

main()