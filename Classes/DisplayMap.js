export default class DisplayMap{
    #displayMap;

    constructor(displayMap){
        this.#displayMap = {...displayMap};
    }

    undoStroke(undoneStroke){
        for (const [key, value] of Object.entries(undoneStroke)) {
            this.setColor(key, value[0]) //set color to what it was before
        }
    }

    redoStroke(redoneStroke){
        for (const [key, value] of Object.entries(redoneStroke)) {
            let nextVal = value[1]; 
            this.#displayMap[key] = nextVal;
        }      
    }

    setColor(index, color){
        if (this.#displayMap.hasOwnProperty(index) === false && color ===null){ return false; } //No change has been made
        else if (this.#displayMap.hasOwnProperty(index) === true && this.#displayMap[index] === color) { return false; }
        else if (color === null){ //remove color
            delete this.#displayMap[index];
            return true;
        }
        else{
            this.#displayMap[index] = color;
            return true;
        }
    }

    getDisplayMap(){
        return this.#displayMap;
    }

    getColorAt(index){
        //return tool at index if the index is in, else return null representing emptiness
        return this.#displayMap.hasOwnProperty(index) ? this.#displayMap[index] : null; 
    }

    getSerializedDisplayMap(){
        let displayMap = this.getDisplayMap();
        return JSON.stringify(displayMap);
    }
}