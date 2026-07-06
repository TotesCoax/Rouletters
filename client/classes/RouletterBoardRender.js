/**
 * @import { Board } from '../../classes/Board.mjs'
 * @import { Letter } from '../../classes/Letter.mjs'
 */

/**
 * A class to assist with rendering Rouletters Board
 */
export class RouletterBoardRender {
    /**
     * 
     * @param {string} puzzleHook - id for board div to target
     * @param {string} clueHook - id for clue container
     * @param {string} guessedHook - id for guessed letters container
     */
    constructor(puzzleHook, clueHook, guessedHook){
        /**@type {HTMLDivElement}*/
        this.boardElement = document.getElementById(puzzleHook)
        /**@type {HTMLDivElement}*/
        this.clueElement = document.getElementById(clueHook)
        /**@type {HTMLDivElement}*/
        this.guessedElement = document.getElementById(guessedHook)
    }
    /**
     * 
     * @param {HTMLDivElement} element 
     */
    clearChildren(element){
        while (element.firstChild){
            element.lastChild.remove()
        }
    }
    /**
     * 
     * @param {Letter} data 
     */
    renderSpace(data){
        let tdHolder = document.createElement('td'),
            letterEL = document.createElement('p')

        if (data.isSpace){
            tdHolder.classList.add('game-space')
        }
        if(data.isNumber){
            letterEL.innerText = "#"
            letterEL.classList.add('revealed')
        }
        if (data.isRevealed){
            letterEL.innerText = data.character
            letterEL.classList.add('revealed')
        }
        letterEL.classList.add('processed')
        tdHolder.append(letterEL)
        return tdHolder
    }
    /**
     * 
     * @param {Letter[]} row 
     */
    renderRow(row){
        let rowContainer = document.createElement('tr')
        row.forEach(letter => {
            let letterContainer = this.renderSpace(letter)
            rowContainer.append(letterContainer)
        })
        return rowContainer
    }
    /**
     * 
     * @param {Letter[][]} array 
     */
    renderBoard(array){
        this.clearChildren(this.boardElement)
        let boardTable = document.createElement('table')
        array.forEach(row => {
            let newRow = this.renderRow(row)
            boardTable.append(newRow)
        })
        this.boardElement.append(boardTable)
    }
    /**
     * 
     * @param {string} text 
     */
    renderClue(text){
        this.clearChildren(this.clueElement)
        let cluePEL = document.createElement('p')
        
        cluePEL.innerText = text
        this.clueElement.append(cluePEL)
    }
    /**
     * 
     * @param {string[]} arrayOfChars 
     */
    renderGuessedLetters(arrayOfChars){
        this.clearChildren(this.guessedElement)
        let lettersEL = document.createElement('p'),
            title = document.createElement('h3')

        title.innerText = "Guessed Letters:"

        arrayOfChars.forEach(letter =>{
            let newSpan = document.createElement('span')
            newSpan.innerText = letter
            lettersEL.append(newSpan)
        })
        this.guessedElement.append(title, lettersEL)
    }
    /**
     * 
     * @param {HTMLElement[]} elementsToAnimateArray 
     */
    revealAnimation(elementsToAnimateArray, classNameToAdd){
        if (elementsToAnimateArray.length === 0){
            return
        }
        let currentAnim = elementsToAnimateArray.shift()
        currentAnim.addEventListener('animationend', () => {
            this.revealAnimation(elementsToAnimateArray, classNameToAdd)
            currentAnim.classList.remove(classNameToAdd)
        }, {once: true})
        currentAnim.classList.add(classNameToAdd)
    }

}