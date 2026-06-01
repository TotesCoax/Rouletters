/**
 * Basic Queue implementation
 */
export class BasicQueue {
    constructor(){
        this.items = []
    }
    /**
     * Adds element to the queue.
     * @param {*} element thing you want added to the queue, can be anything.
     * @returns {void}
     */
    enqueue(element){    
        this.items.push(element)
    }
    /**
     * Removes an item from the queue and returns it.
     * @returns {false|any} Returns false if empty 
     */
    dequeue(){
        if(this.isEmpty()){
            return false
        }
        return this.items.shift();
    }
    /**
     * Returns a copy of the first item in the queue. To remove use dequeue.
     * @returns {false|any} - Returns false if empty 
     */
    peek(){
        if(this.isEmpty()){
            return false
        }
        return this.items[0]
    }
    /**
     * Used to check if queue is empty.
     * @returns {boolean}
     */
    isEmpty(){
        return this.items.length === 0
    }
    /**
     * Returns an array of whatever you put in the queue.
     * @returns {*[]}
     */
    printQueue(){
        let list = []
        this.items.forEach(item => {
            list.push(item)
        })
        return list
    }
}
