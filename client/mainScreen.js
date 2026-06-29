
import { EventCode } from "./classes/EventCode.js"
import { RouletterBoardRender } from './classes/RouletterBoardRender.js'
import { PlayerSectionRender } from './classes/PlayerSectionRender.js'
import { WheelRender } from './classes/WheelRender.js'

let Board = new RouletterBoardRender('mainBoard','clueContainer', 'usedLettersDisplay'),
    Players = new PlayerSectionRender('playerContainer'),
    Wheel = new WheelRender('wheelContainer')

const socket = io({transports: ['websocket', 'polling', 'flashsocket']})


socket.on('connect', () => {
    console.log(`Socket Id: ${socket.id}`)
    socket.emit('boardJoin', socket.id, (res) => {
      console.log(`Data from server: ${res}`)
      socket.emit('gamestateRequest', socket.id, (res)=> {
        console.log(res)
        Board.renderBoard(res.Board.board)
        Board.renderClue(res.Board.clue)
        Board.renderGuessedLetters(res.Board.guessedLetters)
        Wheel.renderWheel(res.Wheel)
        Players.renderPlayerSection(res.PlayerHandler)
        // renderBoard(res.Board.board)
        // renderClue(res.Board.clue)
        // renderGuessedLetters(res.Board.guessedLetters)
        // renderWheel(res.Wheel)
        // renderPlayerTiles(res.PlayerHandler.players, res.PlayerHandler.turnIndicator)
        renderPlayerList(res.PlayerHandler.players)
      })
    })
})

socket.on('playerUpdate', gameStateRequest)


// socket.on('boardUpdate', boardUpdate)

// Board stuff


/**
 * 
 * @param {HTMLElement} element 
 */
function clearChildren(element){
    while (element.firstChild){
        element.lastChild.remove()
    }
}

// Wheel Stuff




let wheelContainer = document.getElementById('wheelContainer')

/**
 * Resets the degree values to more manageable numbers for next calculation.
 */
function resetCurrentDeg(){
    console.log('Wheel Resetting to: ', getComputedStyle(document.documentElement).getPropertyValue('--ending-degree'))
    let newStarting = getComputedStyle(document.documentElement).getPropertyValue('--ending-degree')
    wheelContainer.style.rotate = `${newStarting}`
    wheelContainer.classList.remove('spinning')
    console.log('Wheel Reset to: ', wheelContainer.style)
}

function setSpinAnim(start, power, end){
    document.documentElement.style.setProperty('--starting-degree', `-${start}deg`)
    document.documentElement.style.setProperty('--spin-degree', `-${start+power}deg`)
    document.documentElement.style.setProperty('--ending-degree', `-${end}deg`)
}

function setFlashingSection(index){
    let wheelSections = document.querySelectorAll('.wheel-section'),
        currentSection = wheelSections[index]
    currentSection.addEventListener('animationend', () => {
        currentSection.classList.remove('flashing')
        gameStateRequest()
    }, {once: true})
    currentSection.classList.add('flashing')
}

socket.on('wheelSpin', spinWheel)

/**
 * @typedef {object} SpinData 
 * @prop {number} start
 * @prop {number} power
 * @prop {number} end
 * @prop {number} index
 */

/**
 * 
 * @param {SpinData} dataFromServer power value sent down from the server. 
 */
function spinWheel(dataFromServer){
    console.log(dataFromServer)
    setSpinAnim(dataFromServer.start, dataFromServer.power, dataFromServer.end)
    wheelContainer.addEventListener('animationend', () => {
        resetCurrentDeg()
        setFlashingSection(dataFromServer.index)
        socket.emit('spinAnimEnded', "Let's go again!")
    }, {once: true})
    wheelContainer.classList.add('spinning')
}

    // Offline spin
    const offlineSpinButton = document.getElementById('offlineSpinButton')
    offlineSpinButton.addEventListener('click', offlineSpin)

    function offlineSpin(){
        socket.emit('offlineSpin', 'Spinaroonie')
    }


// Game Actions

    // Submit guess
    const guessForm = document.getElementById('guessForm')
    const guessInput = document.getElementById('guessInput')

    guessForm.addEventListener('submit', handleGuessSubmission)

    /**
     * 
     * @param {SubmitEvent} e 
     */
    function handleGuessSubmission(e){
        e.preventDefault()
        let letter = guessInput.value
        socket.emit(EventCode.letterSubmission, letter)
        guessInput.value = ''
    }

    // Solve

    const solveButton = document.getElementById('solveButton')

    solveButton.addEventListener('click', handleSolve)

    function handleSolve(){
        socket.emit('revealPuzzle', "Show me the money")
    }

    // Next Round

    const nextRoundButton = document.getElementById('nextRoundButton')
    nextRoundButton.addEventListener('click', nextRound)

    function nextRound(){
        socket.emit('nextRound', 'Blerp')
    }


//Admin Menus

    // Refresh
    const gamestateRefreshButton = document.getElementById('gamestateRefreshButton')
    gamestateRefreshButton.addEventListener('click', gameStateRequest)
    function gameStateRequest(){
            socket.emit('gamestateRequest', socket.id, (res)=> {
            console.log(res)
            Board.renderBoard(res.Board.board)
            Board.renderClue(res.Board.clue)
            Board.renderGuessedLetters(res.Board.guessedLetters)
            Wheel.renderWheel(res.Wheel)
            Players.renderPlayerSection(res.PlayerHandler)
            renderPlayerList(res.PlayerHandler.players)
        })
    }

    // File Upload

    const gameFileUpload = document.getElementById('gameFileUpload')
    const gameFileButton = document.getElementById('gameFileButton')

    gameFileButton.addEventListener('click', () => {
        const Reader = new FileReader()

        Reader.readAsText(gameFileUpload.files[0])

        Reader.addEventListener('load', () => {
            const csv = Reader.result
            console.table(csv)
            socket.emit('gameFile', csv)
        })
    })



// Player Menu

    /**
     * Render list of players
     * @param {Player[]} playersArray 
     */
    function renderPlayerList(playersArray){
        let selectGroup = document.getElementById('playerSelect'),
            blankOpt = document.createElement('option')
        clearChildren(selectGroup)
        selectGroup.append(blankOpt)
        playersArray.forEach(player => {
            let optionEl = document.createElement('option')
            optionEl.value = player.name
            optionEl.innerText = player.name
            selectGroup.append(optionEl)
        })
    }


    // Add Player
    const addPlayerButton = document.getElementById('addPlayerButton')
    addPlayerButton.addEventListener('click', addPlayer)
    function addPlayer(){
        let playerName = document.getElementById('addPlayer').value
        socket.emit('manualAdd', playerName)
    }

    // Check for Selected Player
    function isPlayerSelected(){
        let playerName = new String(document.querySelector('#playerSelect').value)
        if (playerName.length < 0){
            return false
        } else {
            return true
        }
    }

    function getPlayer(){
        let playerSelect = document.getElementById("playerSelect")
        if(isPlayerSelected()){
            let playerName = new String(document.querySelector('#playerSelect').value)
            playerSelect.style.border = ""
            return playerName
        } else {
            playerSelect.style.border = "3px red solid"
            return ""
        }
    }

    // Remove Player
    const removePlayerButton = document.getElementById('removePlayerButton')
    removePlayerButton.addEventListener('click', removePlayer)
    function removePlayer(){
        if (!isPlayerSelected()){
            return
        }
        let playerName = document.querySelector('#playerSelect').value
        socket.emit('manualRemove', playerName)
    }

    // Set Score
    const /** @type {HTMLInputElement} */ setScoreInput = document.getElementById('setScoreInput')
    const setScoreButton = document.getElementById('setScoreButton')
    setScoreButton.addEventListener('click', setScore)
    function setScore(){
        if (!isPlayerSelected()){
            return
        }
        let playerName = document.querySelector('#playerSelect').value,
            score = setScoreInput.value
 
        socket.emit('setScore', {name: playerName, score: score})
    }

    // Set Active
    const setActiveButon = document.getElementById('setActiveButton')
    setActiveButon.addEventListener('click', setActive)
    function setActive(){
        if (!isPlayerSelected()){
            return
        }
        let playerName = document.querySelector('#playerSelect').value
        socket.emit('setActive', playerName)
    }