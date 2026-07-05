/**
 * @import { Player } from '../../classes/Player.mjs'
 * @import { PlayerHandler } from '../../classes/PlayerHandler.mjs'
 */

/**
 * A Class to assist with rendering a current player list.
 */
export class PlayerSectionRender {
    /**
     * 
     * @param {string} containerHook - id of element 
     */
    constructor(containerHook){
        /**
         * @type {HTMLDivElement}
         */
        this.playerSection = document.getElementById(containerHook)
    }
    clearChildren(){
        while (this.playerSection.firstChild){
            this.playerSection.lastChild.remove()
        }
    }
    /**
     * 
     * @param {PlayerHandler} data 
     */
    renderPlayerSection(data){
        this.clearChildren()
        data.players.forEach(player => {
            let playerTile = this.renderPlayerTile(player)
            this.playerSection.append(playerTile)
        })
    }
    /**
     * 
     * @param {Player} data 
     */
    renderPlayerTile(data){
        let playerContainerDiv = document.createElement('div'),
            playerNameEl = document.createElement('p'),
            playerRoundScore = document.createElement('p'),
            playerTotalScore = document.createElement('p')

        playerContainerDiv.classList.add('player-tile')
        playerContainerDiv.style.backgroundColor = data.color
        if (!data.isConnected){
            playerContainerDiv.classList.add('disconnected')
        }
        if (data.isActive){
            playerContainerDiv.classList.add('active')
            document.documentElement.style.setProperty('--active-player-border-color', 'white')
            this.getBrightness(data.color) < 127 ? document.documentElement.style.setProperty('--active-player-border-color', 'white') : document.documentElement.style.setProperty('--active-player-border-color', 'black')
        }
        if(this.getBrightness(data.color) < 127){
            playerContainerDiv.style.color = "white"
        }

        playerNameEl.classList.add('player-name')
        playerNameEl.innerText = data.name

        playerRoundScore.classList.add('player-score')
        playerRoundScore.innerText = data.score

        playerTotalScore.classList.add('player-total-score')
        playerTotalScore.innerText = data.totalScore

        playerContainerDiv.append(playerNameEl, playerRoundScore, playerTotalScore)

        return playerContainerDiv
    }
    /**
     * 
     * @param {string} h - color code in hexadecimal
     * @returns 
     */
    hexToRGB(h){
        let r = 0, g = 0, b = 0;

        // 3 digits
        if (h.length == 4) {
            r = "0x" + h[1] + h[1];
            g = "0x" + h[2] + h[2];
            b = "0x" + h[3] + h[3];

        // 6 digits
        } else if (h.length == 7) {
            r = "0x" + h[1] + h[2];
            g = "0x" + h[3] + h[4];
            b = "0x" + h[5] + h[6];
        }
        //   The + somehow magically makes it a number
        return {'red': +r, 'green': +g, 'blue': +b}
    }
    getBrightness(hex){
        let rgb = this.hexToRGB(hex)

        return 0.2126 * rgb.red + 0.7152 * rgb.green + 0.0722 * rgb.blue
    }

}