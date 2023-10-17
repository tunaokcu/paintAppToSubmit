
export default class StrokeStack{
    #strokeStack;
    #currentIndex;

    constructor(){
        this.#strokeStack = [];
        this.#currentIndex = -1;
    }

    startStroke(){
        this.#strokeStack.push({});
        this.#currentIndex += 1;
    }
    
    //index is triangle index, vector is [previousColor, nextColor]
    addToStroke(index, vector){
        //We shouldn't change the vector's previous value
        //And if we are in the same stroke, the next value of the vector is the same as the one in the stroke anyway
        if (!this.#strokeStack[this.#currentIndex].hasOwnProperty(index)){
            this.#strokeStack[this.#currentIndex][index] = [...vector];
            return true;
        }
        return false;
    }

    // should be {index: [previousColor, nextColor]} where tool being null makes the triangle empty
    pushStroke(newStroke){
        this.#currentIndex += 1;
        this.#strokeStack.push({...newStroke});
    }

    popStroke(){
        this.#currentIndex -= 1;
        return {...this.#strokeStack.pop()};
    }

    getSize(){
        return this.#strokeStack.length;
    }

    getCurrentStroke(){
        return this.#strokeStack[this.#currentIndex];
    }
    
    /*
    isStroking(){
        return this.#stroking;
    }*/
}