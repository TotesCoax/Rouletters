console.log('File Loaded')

const turnResult = {
        NOTHING: 0,
        CORRECT: 1,
        INCORRECT: 2,
        SPIN: 3,
        GUESS: 4,
        LOSE: 5,
        BANKRUPT: 6
    }

/**
 * @typedef {object} PlayerInfo
 * @property {string} gameID - id from the server
 * @property {string} name - user selected name
 * @property {number} score - score for the game
 * @property {string} color - hex code of player color
 * @property {string} socketID - id of the socket
 */

function updateLocalStorage(playerInfo){
  let value = JSON.stringify(playerInfo)
  window.localStorage.setItem('playerInfo', value)
}

/**
 * 
 * @returns {PlayerInfo} - parse player info from localStorage
 */
function getPlayerDataFromLocal(){
  let playerString = window.localStorage.getItem('playerInfo')
  return JSON.parse(playerString)
}

const socket = io({transports: ['websocket', 'polling', 'flashsocket']})

socket.on("connect", () => {
  console.log(socket.id)
  let playerID = window.localStorage.getItem('playerInfo') ? getPlayerDataFromLocal().gameID : 'NEW'
  console.log('Connected as: ', playerID)
  socket.emit('playerJoin', playerID, (res) => {
    console.log(res)
    updateInputFields(res)
    updateLocalStorage(res)
    console.log('Handshake complete, local storage updated.')
  })
})

const powerBar = document.getElementById("powerBar")


socket.on(turnResult.SPIN, () => {
  console.log('Spin Turn Registered')
  powerBar.addEventListener('animationend', () => {
    powerBar.classList.remove('flashing')
  }, {once: true})
  powerBar.classList.add('flashing')
})

// Power Bar shit

const scrollPowerContainer = document.getElementById("scrollPowerContainer")

scrollPowerContainer.addEventListener("touchstart", startScrollCalculations)

scrollPowerContainer.addEventListener("touchend", stopScrollCalculations)

// On/Off for calc function example
function startScrollCalculations() {
  scrollSpeedToSend = 0
  scrollRecorder = setInterval(calculateScrollSpeedInterval, 1)
}

function stopScrollCalculations() {
  clearInterval(scrollRecorder)
  console.log(scrollSpeedToSend)
  scrollPowerContainer.scroll({top: 0, behavior: "smooth"})
  console.log(getPlayerDataFromLocal().gameID)
  socket.emit("speedData", {"value": scrollSpeedToSend, "id": getPlayerDataFromLocal().gameID})
}

// Scroll Speed Calc Functions
let lastScrollY = scrollPowerContainer.scrollTop,
  lastTime = Date.now(),
  scrollSpeed = 0,
  scrollRecorder,
  scrollSpeedToSend = 0

function calculateScrollSpeedInterval(){
  const currentScrollY = scrollPowerContainer.scrollTop,
    currentTime = Date.now(),
    scrollDelta = currentScrollY - lastScrollY,
    timeDelta = currentTime - lastTime

    if (timeDelta > 0){ // Avoid division by zero
      scrollSpeed = scrollDelta / timeDelta // Pixels per millisecond
    } else {
      scrollSpeed = 0
    }

    lastScrollY = currentScrollY
    lastTime = currentTime

    if (scrollSpeed !== 0){
        console.log("Scroll Speed:", scrollSpeed, "pixels/ms")
    }

    if (scrollSpeed !==0 && scrollSpeed > scrollSpeedToSend){
      scrollSpeedToSend = scrollSpeed
    }
}

// Scroll Meter Sizing
// function resizePowerBar(){
//   let powerBar = document.getElementById("powerBar"),
//       viewportHeight = window.outerHeight,
//       containerHeight = Math.round(viewportHeight),
//       barTotalHeight = Math.round(containerHeight * 2.0),
//       blackRatio = Math.round((containerHeight/barTotalHeight)*100),
//       colorFactor = Math.round((100 - blackRatio)/3)

//   console.log(containerHeight, barTotalHeight, blackRatio, colorFactor)

//   scrollPowerContainer.style.height = `${containerHeight}px`
//   powerBar.style.height = `${barTotalHeight}px`

//   powerBar.style.background = `linear-gradient(black, black ${blackRatio}%, green ${blackRatio+colorFactor}%,yellow ${blackRatio+colorFactor*2}%, red 100%)`
  
//   return [scrollPowerContainer.style.height, powerBar.style.height]
// }

// // resizePowerBar()


// Menu Stuff

const menuDisplay = document.getElementById('menuDisplay'),
      menuContent = document.getElementById('menuContent'),
      leftArrow = document.getElementById('leftArrow'),
      rightArrow = document.getElementById('rightArrow'),
      nameInput = document.getElementById('nameInput'),
      colorInput = document.getElementById('colorInput')

menuDisplay.addEventListener('click', (event) => {
  console.log(event.target, event.target.closest('#menuContent > *'))
  if (event.target.closest('#menuContent > *')){
    return
  }
  menuContent.classList.toggle('hidden')
  leftArrow.classList.toggle('hidden')
  rightArrow.classList.toggle('hidden')
})

nameInput.addEventListener('input', () => {
  console.log('Namechange triggred')
  socket.emit('nameChange', {id: getPlayerDataFromLocal().gameID, name: nameInput.value})
})

colorInput.addEventListener('input', () => {
  document.documentElement.style.setProperty('--playerBGColor', `${colorInput.value}`)
  socket.emit('colorChange', {id: getPlayerDataFromLocal().gameID, color: colorInput.value})
})

/**
 * 
 * @param {PlayerInfo} data 
 */
function updateInputFields(data){
      updateElementValue(nameInput, data.name)
      updateElementValue(colorInput, data.color)
      document.documentElement.style.setProperty('--playerBGColor', `${colorInput.value}`)
}

/**
 * 
 * @param {HTMLElement} element 
 * @param {string} value 
 */
function updateElementValue(element, value){
  console.log(element, value)
  element.value = value
}