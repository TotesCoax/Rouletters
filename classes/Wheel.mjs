import { Logger } from "./Logger.mjs"

export class Wheel{
    constructor(logFilePath = "./", options = {sections:[]}){
        this.WheelLogger = new Logger(logFilePath, "Wheel")
        this.sections = options.sections
        this.sectionWidthInDeg = 0
        this.currentDeg = 0
        this.minValue = 3
        this.maxValue = 9
        this.speedPowerFactor = 14 //7.2 is roughly the factor to get a 50 power spin to go 360 degrees, if i did the math correct (360/50)
        this.generateSections()
    }
    /**
     * 
     * @param {number} bonusValue the one big bonus space value, it increases each round in the game.
     * @param {number} numberOfSections number of sections in the wheel, defaults to 24
     */
    generateSections(bonusValue = 1000, numberOfSections = 24){
        let sectionValues = [],
            specialSpaces = 4,
            requiredNumbers = numberOfSections - specialSpaces
        for (let index = 0; index < requiredNumbers; index++) {
            sectionValues.push(this.getRandomValue(this.minValue, this.maxValue))
        }
        sectionValues.push(bonusValue, 'bankrupt', 'lose a turn', 'lose a turn')
        this.sections = sectionValues
        this.shuffleSections()
        this.sectionWidthInDeg = 360 / this.sections.length
        this.WheelLogger.info(`Wheel sections generated`)
    }
    /**
     * Generates random values for the board. For right now I don't care much for distribution balance of scores.
     * @param {number} min integer
     * @param {number} max integer
     * @returns {number} random number with two zeroes added.
     */
    getRandomValue(min, max){
        this.WheelLogger.log(`Generated random value`)
        return (Math.floor(Math.random() * (max - min + 1)) + min) * 100
    }
    coinFlip(){
        this.WheelLogger.log(`Flipping coin`)
        return Math.random() < .5
    }
    shuffleSections(){
        for (let i = this.sections.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1))
            let temp = this.sections[i]
            this.sections[i] = this.sections[j]
            this.sections[j] = temp
        }
        this.WheelLogger.info(`Wheel sections have been shuffled.`)
    }
    calcRandomNudge(baseNum){
        let nudgeValue = baseNum * (1 + Math.random())
        this.WheelLogger.log(`Nudge value of ${nudgeValue}`)
        if (this.coinFlip()){
            return nudgeValue
        } else {
            return nudgeValue * -1
        }
    }
    calcWheelSpinPowerInDegrees(speedFromPhone){
        this.WheelLogger.log(`Calculating wheel speed from phone data.`)
        // .6 is a stdv of about 8.5 over 10000 spins, which is like +/- one half section
        return Math.round((speedFromPhone * this.speedPowerFactor) + (this.calcRandomNudge(speedFromPhone))) 
    }
    resetCurrentDeg(){
        this.WheelLogger.log(`Reset Current degree check, current reading: ${this.currentDeg}`)
        while (this.currentDeg > 360){
            this.WheelLogger.log(`Lowering from ${this.currentDeg} to ${this.currentDeg - 360}`)
            this.currentDeg -= 360
        }
        return this.currentDeg
    }
    /**
     * Currently spins counter clockwise, for clockwise, times rotation by -1
     * @param {number} speedFromPhone 
     * @returns {number}
     */
    spinWheel(speedFromPhone){
        let rotation = this.calcWheelSpinPowerInDegrees(speedFromPhone)
        this.WheelLogger.log(`Power Rating: ${rotation}, spinning from ${this.currentDeg} to ${this.currentDeg + rotation}, using speed: ${speedFromPhone}`)
        this.currentDeg += rotation
        this.resetCurrentDeg()
        return rotation
    }
    /**
     * 
     * @returns {number} - Index of current wheel position in the array
     */
    getWheelIndex(){
        return Math.floor(this.currentDeg/this.sectionWidthInDeg)
    }
    /**
     * 
     * @returns {number|string}
     */
    getWheelValue(){
        let reading = this.sections[this.getWheelIndex()]
        this.WheelLogger.log(`reading: ${reading} ${Math.floor(this.currentDeg/this.sectionWidthInDeg)}`)
        return reading
    }
    getCurrentDeg(){
        return this.currentDeg
    }
}

// module.exports = { Wheel }